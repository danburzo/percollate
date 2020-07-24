#!/usr/bin/env node
const pup = require('puppeteer');
const got = require('got');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs');
const css = require('css');
const slugify = require('slugify');
const Readability = require('./vendor/readability');
const pkg = require('./package.json');
const uuid = require('uuid/v1');
let Epub = require('epub-gen');

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

const resolve = path =>
	require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});

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
async function bundle(items, options) {
	out.write('Generating temporary HTML file... ');
	const temp_file = tmp.tmpNameSync({ postfix: '.html' });

	const stylesheet = resolve(options.style || './templates/default.css');
	const style = fs.readFileSync(stylesheet, 'utf8') + (options.css || '');
	const use_toc = options.toc && items.length > 1;

	const html = nunjucks.renderString(
		fs.readFileSync(
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

	fs.writeFileSync(temp_file, html);

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
	--------------------------------
 */
async function bundleEpub(items, options) {
	const stylesheet = resolve(options.style || './templates/default.css');
	const style = fs.readFileSync(stylesheet, 'utf8') + (options.css || '');

	const html = nunjucks.renderString(
		fs.readFileSync(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items,
			style,
			stylesheet // deprecated
		}
	);

	out('Saving EPUB...\n');

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
			? `${slugify(items[0].title || 'Untitled page')}.epub`
			: `percollate-${Date.now()}.epub`);

	let option = {
		title: items[0].title,
		content: [
			{
				data: html
			}
		]
	};

	new Epub(option, output_path);

	out(`Saved EPUB: ${output_path}\n`);
}

/*
	Bundle the HTML files into a HTML
	--------------------------------
 */
async function bundleHtml(items, options) {
	const stylesheet = resolve(options.style || './templates/default.css');
	const style = fs.readFileSync(stylesheet, 'utf8') + (options.css || '');

	const html = nunjucks.renderString(
		fs.readFileSync(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items,
			style,
			stylesheet // deprecated
		}
	);

	out('Saving HTML...\n');

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

	fs.writeFile(output_path, html, function (err) {
		if (err) {
			return console.log(err);
		}

		// console.log("The file was saved!");
	});

	out(`Saved HTML: ${output_path}\n`);
}

/*
	Generate PDF
 */
async function pdf(urls, options) {
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
			await bundle([item], options);
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
		await bundle(items, options);
	}
}

/*
	Generate EPUB
 */
async function epub(urls, options) {
	if (!configured) {
		configure();
	}
	if (!urls.length) return;
	let items = [];
	for (let url of urls) {
		let item = await cleanup(url, options);
		if (options.individual) {
			await bundleEpub([item], options);
		} else {
			items.push(item);
		}
	}
	if (!options.individual) {
		await bundleEpub(items, options);
	}
}

/*
	Generate HTML
 */
async function html(urls, options) {
	if (!configured) {
		configure();
	}
	if (!urls.length) return;
	let items = [];
	for (let url of urls) {
		let item = await cleanup(url, options);
		if (options.individual) {
			await bundleHtml([item], options);
		} else {
			items.push(item);
		}
	}
	if (!options.individual) {
		await bundleHtml(items, options);
	}
}

module.exports = { configure, pdf, epub, html };
