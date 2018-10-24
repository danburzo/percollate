#!/usr/bin/env node
const pup = require('puppeteer');
const got = require('got');
const ora = require('ora');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs');
const css = require('css');
const slugify = require('slugify');
const Readability = require('./vendor/readability');
const pkg = require('./package.json');
const gullible = require('./gullible');

const spinner = ora();

const {
	ampToHtml,
	fixLazyLoadedImages,
	imagesAtFullSize,
	wikipediaSpecific,
	noUselessHref,
	relativeToAbsoluteURIs,
	singleImgToFigure
} = require('./src/enhancements');
const get_style_attribute_value = require('./src/get-style-attribute-value');

const resolve = path =>
	require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});

const enhancePage = function(dom) {
	// Note: the order of the enhancements matters!
	[
		ampToHtml,
		fixLazyLoadedImages,
		relativeToAbsoluteURIs,
		imagesAtFullSize,
		singleImgToFigure,
		noUselessHref,
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
function configure() {
	nunjucks.configure({ autoescape: false, noCache: true });

	/*
		Override Readability's regular expressions
		to include our positive/negative CSS selectors.

		Note: this may change in Readability at some point.
	 */
	Readability.prototype.REGEXPS.positive = new RegExp(
		`${
			Readability.prototype.REGEXPS.positive.source
		}|pcl\-\-readability\-positive`,
		'i'
	);
	Readability.prototype.REGEXPS.negative = new RegExp(
		`${
			Readability.prototype.REGEXPS.negative.source
		}|pcl\-\-readability\-negative`,
		'i'
	);
}

/*
	Fetch a web page and clean the HTML
	-----------------------------------
 */
async function cleanup(url, options) {
	try {
		spinner.start(`Fetching: ${url}`);
		const content = (await got(url, {
			headers: {
				'user-agent': `percollate/${pkg.version}`
			}
		})).body;
		spinner.succeed();

		spinner.start('Enhancing web page');
		const dom = createDom({ url, content });

		const amp = dom.window.document.querySelector('link[rel=amphtml]');
		if (amp && options.amp) {
			spinner.succeed('Found AMP version');
			return cleanup(amp.href);
		}

		const doc = dom.window.document;

		if (options.only) {
			const to_include = doc.querySelectorAll(options.only);
			doc.body.innerHTML = '<article></article>';
			to_include.forEach(el => {
				// el.classList.add('pcl--readability-positive');
				doc.body.firstChild.appendChild(el);
			});
		}

		/*
			Apply the `positive`/`negative` classes
		 */

		if (options.positive) {
			doc.querySelectorAll(options.positive).forEach(el =>
				el.classList.add('pcl--readability-positive')
			);
		}

		if (options.negative) {
			doc.querySelectorAll(options.negative).forEach(el =>
				el.classList.add('pcl--readability-negative')
			);
		}

		/* 
			Run enhancements
			----------------
		*/
		enhancePage(dom);

		let content_el = gullible(dom.window);

		// Run through readability and return
		const parsed = new Readability(dom.window.document, {
			classesToPreserve: [
				'no-href',

				/*
					Placed on some <a> elements
					as in-page anchors
				 */
				'anchor',
				'pcl--readability-positive',
				'pcl--readability-negative'
			]
		}).parse();

		spinner.succeed();

		return {
			...parsed,
			content: content_el ? content_el.innerHTML : parsed.content,
			url
		};
	} catch (error) {
		spinner.fail(error.message);
		throw error;
	}
}

/*
	Bundle the HTML files into a PDF
	--------------------------------
 */
async function bundle(items, options) {
	spinner.start('Generating temporary HTML file');
	const temp_file = tmp.tmpNameSync({ postfix: '.html' });

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

	spinner.succeed(`Temporary HTML file: file://${temp_file}`);

	spinner.start('Saving PDF');

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

	spinner.succeed(`Saved PDF: ${output_path}`);
}

/*
	Generate PDF
 */
async function pdf(urls, options) {
	if (!urls.length) return;
	let items = [];
	for (let url of urls) {
		let item = await cleanup(url, options);
		if (options.individual) {
			await bundle([item], options);
		} else {
			items.push(item);
		}
	}
	if (!options.individual) {
		await bundle(items, options);
	}
}

/*
	Generate EPUB
 */
async function epub(urls, options) {
	console.log('TODO', urls, options);
}

/*
	Generate HTML
 */
async function html(urls, options) {
	console.log('TODO', urls, options);
}

module.exports = { configure, pdf, epub, html };
