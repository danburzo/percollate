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

const { imagesAtFullSize, wikipediaSpecific } = require('./src/enhancements');
const getStyleAttributeValue = require('./src/get-style-attribute-value');

const DEFAULT_STYLESHEET_PATH = './templates/default.css';
const DEFAULT_TEMPLATE_PATH = './templates/default.html';

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
async function fetchDocument(url) {
	console.log(`Fetching: ${url}`);
	const content = (await got(url)).body;

	console.log('Enhancing web page');
	const dom = createDom({ url, content });

	/* 
		Run enhancements
		----------------
	*/
	enhancePage(dom);

	// Run through readability and return
	const parsed = new Readability(dom.window.document).parse();

	return { ...parsed, url };
}

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
			style: getStyleAttributeValue(cssAst, '.header-template')
		}
	);

	const footerTemplate = doc.querySelector('.footer-template');
	const footer = createPartialDocument(
		footerTemplate ? footerTemplate.innerHTML : '<span></span>',
		{
			style: getStyleAttributeValue(cssAst, '.footer-template')
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

/*
	Generate PDF
 */
async function pdf(urls, options) {
	let items = [];
	for (let url of urls) {
		items.push(await fetchDocument(url));
	}
	bundle(items, options);
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
