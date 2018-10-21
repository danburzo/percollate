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

const {
	imagesAtFullSize,
	wikipediaSpecific,
	noUselessHref
} = require('./src/enhancements');
const { extractCss } = require('./style-utils');

const spinner = ora();

const DEFAULT_STYLESHEET_PATH = '../templates/default.css';
const DEFAULT_TEMPLATE_PATH = '../templates/default.html';

const resolve = path =>
	require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});

const enhancePage = function(dom) {
	imagesAtFullSize(dom.window.document);
	noUselessHref(dom.window.document);
	wikipediaSpecific(dom.window.document);
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
}

const createDocument = content => createDom({ content }).window.document;

/*
	Creates a partial document
	--------------------------
*/
const createPartial = (content, { style } = {}) => {
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
	Fetch a web page and clean the HTML
	-----------------------------------
 */
async function fetchDocument(url, { _fetch } = {}) {
	try {
		spinner.start(`Fetching: ${url}`);
		const fetch = _fetch || got;
		const content = (await fetch(url)).body;
		spinner.succeed();

		spinner.start('Enhancing web page');
		const dom = createDom({ url, content });

		/* 
			Run enhancements
			----------------
		*/
		enhancePage(dom);

		// Run through readability and return
		const parsed = new Readability(dom.window.document, {
			classesToPreserve: ['no-href']
		}).parse();

		spinner.succeed();

		return { ...parsed, url };
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
	const tempFilePath = tmp.tmpNameSync({ postfix: '.html' });

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
	const header = createPartial(
		headerTemplate ? headerTemplate.innerHTML : '<span></span>',
		{
			style: extractCss(cssAst, '.header-template')
		}
	);

	const footerTemplate = doc.querySelector('.footer-template');
	const footer = createPartial(
		footerTemplate ? footerTemplate.innerHTML : '<span></span>',
		{
			style: extractCss(cssAst, '.footer-template')
		}
	);

	fs.writeFileSync(tempFilePath, html);

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

	return {
		tempFilePath: tempFilePath,
		outputPath: output_path
	};
}

module.exports = { bundle, fetchDocument, configure };
