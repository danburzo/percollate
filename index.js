#!/usr/bin/env node
const pup = require('puppeteer');
const archiver = require('archiver');
const got = require('got');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs').promises;
const _fs = require('fs');
const path = require('path');
const css = require('css');
const slugify = require('slugify');
const Readability = require('./vendor/readability');
const pkg = require('./package.json');
const uuid = require('uuid/v1');

const {
	ampToHtml,
	fixLazyLoadedImages,
	imagesAtFullSize,
	wikipediaSpecific,
	noUselessHref,
	relativeToAbsoluteURIs,
	singleImgToFigure,
	expandDetailsElements
} = require('./src/enhancements');
const get_style_attribute_value = require('./src/get-style-attribute-value');

const out = process.stdout;

const resolve = require('./src/util/resolve');

const enhancePage = function (dom) {
	// Note: the order of the enhancements matters!
	[
		ampToHtml,
		fixLazyLoadedImages,
		relativeToAbsoluteURIs,
		imagesAtFullSize,
		singleImgToFigure,
		noUselessHref,
		expandDetailsElements,
		wikipediaSpecific
	].forEach(enhancement => {
		enhancement(dom.window.document);
	});
};

function createDom({ url, content }) {
	const dom = new JSDOM(content, { url });

	// Force relative URL resolution
	dom.window.document.body.setAttribute(null, null);

	return dom;
}

/*
	Some setup
	----------
 */
let configured = false;
function configure() {
	if (!configured) {
		nunjucks.configure({ autoescape: false, noCache: true });
		configured = true;
	}
}

/*
	Fetch a web page and clean the HTML
	-----------------------------------
 */

function fetchContent(url) {
	if (url === '-') {
		// Read from stdin
		return new Promise((fulfill, reject) => {
			let content = '';
			process.stdin
				.setEncoding('utf8')
				.on('readable', () => {
					let chunk;
					while ((chunk = process.stdin.read()) !== null) {
						content += chunk;
					}
				})
				.on('end', () => {
					fulfill(content);
				})
				.on('error', () => {
					reject(error);
				});
		});
	} else {
		/*
			Must ensure that the URL is properly encoded.
			See: https://github.com/danburzo/percollate/pull/83
		 */
		return got(encodeURI(decodeURI(url)), {
			headers: {
				'user-agent': `percollate/${pkg.version}`
			}
		}).then(result => result.body);
	}
}

async function cleanup(url, options, preferred_url) {
	try {
		out.write(`Fetching: ${url}`);

		const content = await fetchContent(url);

		out.write(' ✓\n');

		const final_url =
			preferred_url !== undefined
				? preferred_url
				: url === '-'
				? undefined
				: url;

		const dom = createDom({
			url: final_url,
			content
		});

		const amp = dom.window.document.querySelector('link[rel=amphtml]');
		if (amp && options.amp) {
			out.write('\nFound AMP version (use `--no-amp` to ignore)\n');
			return cleanup(amp.href, options, amp.href);
		}

		out.write('Enhancing web page...');

		/* 
			Run enhancements
			----------------
		*/
		enhancePage(dom);

		// Run through readability and return
		const parsed = new Readability(dom.window.document, {
			classesToPreserve: [
				'no-href',

				/*
					Placed on some <a> elements
					as in-page anchors
				 */
				'anchor'
			]
		}).parse();

		out.write(' ✓\n');
		return {
			...parsed,
			id: `percollate-page-${uuid()}`,
			url: final_url
		};
	} catch (error) {
		console.error(error.message);
		throw error;
	}
}

/*
	Bundle the HTML files into a PDF
	--------------------------------
 */
async function bundlePdf(items, options) {
	out.write('Generating temporary HTML file... ');
	const temp_file = tmp.tmpNameSync({ postfix: '.html' });

	const stylesheet = resolve(options.style || './templates/default.css');
	const style = (await fs.readFile(stylesheet, 'utf8')) + (options.css || '');
	const use_toc = options.toc && items.length > 1;

	const html = nunjucks.renderString(
		await fs.readFile(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items,
			style,
			stylesheet, // deprecated
			options: {
				use_toc
			}
		}
	);

	const doc = new JSDOM(html).window.document;
	const headerTemplate = doc.querySelector('.header-template');
	const footerTemplate = doc.querySelector('.footer-template');
	const header = new JSDOM(
		headerTemplate ? headerTemplate.innerHTML : '<span></span>'
	).window.document;
	const footer = new JSDOM(
		footerTemplate ? footerTemplate.innerHTML : '<span></span>'
	).window.document;

	const css_ast = css.parse(style);

	const header_style = get_style_attribute_value(css_ast, '.header-template');
	const header_div = header.querySelector('body :first-child');

	if (header_div && header_style) {
		header_div.setAttribute(
			'style',
			`
				${header_style};
				${header_div.getAttribute('style') || ''}
			`
		);
	}

	const footer_style = get_style_attribute_value(css_ast, '.footer-template');
	const footer_div = footer.querySelector('body :first-child');

	if (footer_div && footer_style) {
		footer_div.setAttribute(
			'style',
			`
				${footer_style};
				${footer_div.getAttribute('style') || ''}
			`
		);
	}

	await fs.writeFile(temp_file, html);

	out.write('✓\n');
	out.write(`Temporary HTML file: file://${temp_file}\n`);

	const browser = await pup.launch({
		headless: true,
		/*
			Allow running with no sandbox
			See: https://github.com/danburzo/percollate/issues/26
		 */
		args: options.sandbox
			? undefined
			: ['--no-sandbox', '--disable-setuid-sandbox'],
		defaultViewport: {
			// Emulate retina display (@2x)...
			deviceScaleFactor: 2,
			// ...but then we need to provide the other
			// viewport parameters as well
			width: 1920,
			height: 1080
		}
	});
	const page = await browser.newPage();

	/*
		Increase the navigation timeout to 2 minutes
		See: https://github.com/danburzo/percollate/issues/80
	 */
	page.setDefaultNavigationTimeout(120 * 1000);

	if (options.debug) {
		page.on('response', response => {
			out.write(`Fetched: ${response.url()}\n`);
		});
	}

	await page.goto(`file://${temp_file}`, { waitUntil: 'load' });

	/*
		When no output path is present,
		produce the file name from the web page title
		(if a single page was sent as argument),
		or a timestamped file (for the moment)
		in case we're bundling many web pages.
	 */
	const output_path =
		options.output ||
		(items.length === 1
			? `${slugify(items[0].title || 'Untitled page')}.pdf`
			: `percollate-${Date.now()}.pdf`);

	await page.pdf({
		path: output_path,
		preferCSSPageSize: true,
		displayHeaderFooter: true,
		headerTemplate: header.body.innerHTML,
		footerTemplate: footer.body.innerHTML,
		printBackground: true
	});

	await browser.close();

	out.write(`Saved PDF: ${output_path}\n`);
}

/*
	Bundle the HTML files into a EPUB
	---------------------------------
 */
async function bundleEpub(items, options) {
	const stylesheet = resolve(options.style || './templates/default.css');
	const style = (await fs.readFile(stylesheet, 'utf8')) + (options.css || '');
	const use_toc = options.toc && items.length > 1;

	const html = nunjucks.renderString(
		await fs.readFile(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items,
			style,
			stylesheet, // deprecated
			options: {
				use_toc
			}
		}
	);

	out.write('Saving EPUB...\n');

	/*
		When no output path is present,
		produce the file name from the web page title
		(if a single page was sent as argument),
		or a timestamped file (for the moment)
		in case we're bundling many web pages.
	 */

	const now = Date.now();

	const output_path =
		options.output ||
		(items.length === 1
			? `${slugify(items[0].title || 'Untitled page')}.epub`
			: `percollate-${now}.epub`);

	epubgen(
		{
			title: items.length === 1 ? items[0].title : `percollate-${now}`,
			date: new Date(now).toISOString(),
			uuid: uuid(),
			items
		},
		output_path
	);

	out.write(`Saved EPUB: ${output_path}\n`);
}

/*
	Bundle the HTML files into a HTML
	--------------------------------
 */
async function bundleHtml(items, options) {
	const stylesheet = resolve(options.style || './templates/default.css');
	const style = (await fs.readFile(stylesheet, 'utf8')) + (options.css || '');
	const use_toc = options.toc && items.length > 1;

	const html = nunjucks.renderString(
		await fs.readFile(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items,
			style,
			stylesheet, // deprecated
			options: {
				use_toc
			}
		}
	);

	out.write('Saving HTML...\n');

	/*
		When no output path is present,
		produce the file name from the web page title
		(if a single page was sent as argument),
		or a timestamped file (for the moment)
		in case we're bundling many web pages.
	 */
	const output_path =
		options.output ||
		(items.length === 1
			? `${slugify(items[0].title || 'Untitled page')}.html`
			: `percollate-${Date.now()}.html`);

	await fs.writeFile(output_path, html);

	out.write(`Saved HTML: ${output_path}\n`);
}

async function generate(urls, options, fn) {
	if (!configured) {
		configure();
	}
	if (!urls.length) return;
	let items = [];

	if (options.individual) {
		for (let i = 0; i < urls.length; i++) {
			let item = await cleanup(
				urls[i],
				options,
				options.url ? options.url[i] : undefined
			);
			await fn([item], options);
		}
	} else {
		for (let i = 0; i < urls.length; i++) {
			let item = await cleanup(
				urls[i],
				options,
				options.url ? options.url[i] : undefined
			);
			items.push(item);
		}
		await fn(items, options);
	}
}

/*
	Generate PDF
 */
async function pdf(urls, options) {
	generate(urls, options, bundlePdf);
}

/*
	Generate EPUB
 */
async function epub(urls, options) {
	generate(urls, options, bundleEpub);
}

/*
	Generate HTML
 */
async function html(urls, options) {
	generate(urls, options, bundleHtml);
}

/*
	Produce an EPUB file
	--------------------

	Reference: 

		https://www.ibm.com/developerworks/xml/tutorials/x-epubtut/index.html
 */

async function epubgen(data, output_path) {
	const template_base = path.join(__dirname, './templates/epub/');

	const output = _fs.createWriteStream(output_path);
	const archive = archiver('zip', {
		store: true
	});

	output
		.on('close', () => {
			out.write(archive.pointer() + ' total bytes');
			out.write(
				'archiver has been finalized and the output file descriptor has closed.'
			);
		})
		.on('end', () => {
			out.write('Data has been drained');
		});

	archive
		.on('warning', err => {
			throw err;
		})
		.on('error', err => {
			throw err;
		})
		.pipe(output);

	// mimetype file must be first
	archive.append('application/epub+zip', { name: 'mimetype' });

	// static files from META-INF
	archive.directory(path.join(template_base, 'META-INF'), 'META-INF');

	const contentTemplate = await fs.readFile(
		path.join(template_base, 'OEBPS/content.xhtml'),
		'utf8'
	);
	const navTemplate = await fs.readFile(
		path.join(template_base, 'OEBPS/nav.xhtml'),
		'utf8'
	);
	const tocTemplate = await fs.readFile(
		path.join(template_base, 'OEBPS/toc.ncx'),
		'utf8'
	);
	const opfTemplate = await fs.readFile(
		path.join(template_base, 'OEBPS/content.opf'),
		'utf8'
	);

	data.items.forEach((item, idx) => {
		let item_content = nunjucks.renderString(contentTemplate, {
			...data,
			item
		});
		archive.append(item_content, { name: `OEBPS/${item.id}.xhtml` });
	});

	const nav = nunjucks.renderString(navTemplate, data);
	const opf = nunjucks.renderString(opfTemplate, data);
	const toc = nunjucks.renderString(tocTemplate, data);

	archive.append(nav, { name: 'OEBPS/nav.xhtml' });
	archive.append(opf, { name: 'OEBPS/content.opf' });
	archive.append(toc, { name: 'OEBPS/toc.ncx' });

	archive.finalize();
}

module.exports = {
	configure,
	pdf,
	epub,
	epubgen,
	html
};
