const pup = require('puppeteer');
const got = require('got');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs');
const css = require('css');
const slugify = require('slugify');
const Readability = require('../vendor/readability');

const { imagesAtFullSize, wikipediaSpecific } = require('./enhancements');
const { extractCss } = require('./style-utils');

const DEFAULT_STYLESHEET_PATH = '../templates/default.css';
const DEFAULT_TEMPLATE_PATH = '../templates/default.html';

const resolve = path =>
	require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});

const enhancePage = function(dom) {
	imagesAtFullSize(dom.window.document);
	wikipediaSpecific(dom.window.document);
};

function createDom({ url, content }) {
	const dom = new JSDOM(content);
	if (url) {
		dom.reconfigure({ url });
	}
	return dom;
}

const createDocument = content => createDom({ content }).window.document;

const createPartialDocument = (content, { style } = {}) => {
	const doc = createDocument(content);

	const rootDiv = doc.querySelector('body :first-child');

	if (rootDiv && style) {
		rootDiv.setAttribute(
			'style',
			`
				${style};
				${rootDiv.getAttribute('style') || ''};
			`
		);
	}

	return doc;
};

/*
	Some setup
	----------
 */
function configure() {
	nunjucks.configure({ autoescape: false, noCache: true });
}

/*
	Fetch a web page and clean the HTML
	-----------------------------------
 */
async function fetchDocument(url, { _fetch }) {
	console.log(`Fetching: ${url}`);
	const fetch = _fetch || got;
	const content = (await fetch(url)).body;

	const dom = createDom({ url, content });

	/* 
        Run enhancements
        ----------------
	*/
	console.log('Enhancing web page');
	enhancePage(dom);

	// Run through readability and return
	const parsed = new Readability(dom.window.document).parse();
	console.log(dom.window.document.innerHTML);

	return { ...parsed, url };
}

/*
	Bundle the HTML files into a PDF
	--------------------------------
 */
async function bundle(items, options) {
	const tempFilePath = tmp.tmpNameSync({ postfix: '.html' });

	console.log(`Generating temporary HTML file:\nfile://${tempFilePath}`);

	const stylesheet = resolve(options.style || DEFAULT_STYLESHEET_PATH);
	const style = fs.readFileSync(stylesheet, 'utf8') + (options.css || '');

	const html = nunjucks.renderString(
		fs.readFileSync(
			resolve(options.template || DEFAULT_TEMPLATE_PATH),
			'utf8'
		),
		{ items, style, stylesheet } // stylesheet is deprecated
	);

	const doc = createDocument(html);
	const cssAst = css.parse(style);

	const headerTemplate = doc.querySelector('.header-template');
	const header = createPartialDocument(
		headerTemplate ? headerTemplate.innerHTML : '<span></span>',
		{
			style: extractCss(cssAst, '.header-template')
		}
	);

	const footerTemplate = doc.querySelector('.footer-template');
	const footer = createPartialDocument(
		footerTemplate ? footerTemplate.innerHTML : '<span></span>',
		{
			style: extractCss(cssAst, '.footer-template')
		}
	);

	fs.writeFileSync(tempFilePath, html);

	const browser = await pup.launch({
		headless: true,
		/*
			Allow running with no sandbox
			See: https://github.com/danburzo/percollate/issues/26
		 */
		args: options.sandbox
			? undefined
			: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();
	await page.goto(`file://${tempFilePath}`, { waitUntil: 'load' });

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

	console.log(`Saving PDF: ${output_path}`);

	await page.pdf({
		path: output_path,
		preferCSSPageSize: true,
		displayHeaderFooter: true,
		headerTemplate: header.body.innerHTML,
		footerTemplate: footer.body.innerHTML,
		printBackground: true
	});

	await browser.close();
}

module.exports = { bundle, fetchDocument, configure };
