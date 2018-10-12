#!/usr/bin/env node
const program = require('commander');
const pkg = require('./package.json');
const pup = require('puppeteer');
const readability = require('./vendor/readability');
const got = require('got');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs');
const { imagesAtFullSize, wikipediaSpecific } = require('./src/enhancements');
const css = require('css');
const get_style_attribute_value = require('./src/get-style-attribute-value');

function resolve(path) {
	return require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});
}

/*
	Some setup
	----------
 */
nunjucks.configure({ autoescape: false, noCache: true });

/*
	Fetch a web page and clean the HTML
	-----------------------------------
 */
async function cleanup(url) {
	console.log(`Fetching: ${url}`);
	const content = (await got(url)).body;

	console.log('Enhancing web page');
	const dom = new JSDOM(content);
	dom.reconfigure({ url: url });

	/* 
		Run enhancements
		----------------
	*/
	imagesAtFullSize(dom.window.document);
	wikipediaSpecific(dom.window.document);

	// Run through readability and return
	let parsed = new readability(dom.window.document).parse();

	return {
		...parsed,

		// Add in some stuff
		url: url
	};
}

/*
	Bundle the HTML files into a PDF
	--------------------------------
 */
async function bundle(items, options) {
	var temp_file = tmp.tmpNameSync({
		postfix: '.html'
	});

	console.log(`Generating temporary HTML file at: ${temp_file}`);

	const stylesheet = resolve(options.style || './templates/default.css');
	const style = fs.readFileSync(stylesheet, 'utf8') + (options.css || '');

	const html = nunjucks.renderString(
		fs.readFileSync(
			resolve(options.template || './templates/default.html'),
			'utf8'
		),
		{
			items: items,
			style: style,

			// deprecated
			stylesheet: stylesheet
		}
	);

	const doc = new JSDOM(html).window.document;
	let headerTemplate = doc.querySelector('.header-template');
	let footerTemplate = doc.querySelector('.footer-template');
	let header = new JSDOM(
		headerTemplate ? headerTemplate.innerHTML : '<span></span>'
	).window.document;
	let footer = new JSDOM(
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

	console.log('Saving as PDF');
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
	await page.goto(`file://${temp_file}`, { waitUntil: 'load' });

	await page.pdf({
		path: options.output,
		preferCSSPageSize: true,
		displayHeaderFooter: true,
		headerTemplate: header.body.innerHTML,
		footerTemplate: footer.body.innerHTML,
		printBackground: true
	});

	await browser.close();
}

/*
	Command-Line Interface definition
	---------------------------------
 */

function with_common_options(cmd) {
	return cmd
		.option('-o, --output [output]', 'Path for the generated bundle')
		.option('--template [template]', 'Path to custom HTML template')
		.option('--style [stylesheet]', 'Path to custom CSS')
		.option('--css [style]', 'Additional CSS style');
}

program.version(pkg.version);

with_common_options(program.command('pdf [urls...]'))
	.option('--no-sandbox', 'Passed to Puppeteer')
	.description('Bundle web pages as a PDF file')
	.action(pdf);

with_common_options(program.command('epub [urls...]'))
	.description('Bundle web pages as an EPUB file')
	.action(epub);

with_common_options(program.command('html [urls...]'))
	.description('Bundle web pages as a HTML file')
	.action(html);

program.parse(process.argv);

/*
	CLI commands
	------------
 */

/*
	Generate PDF
 */
async function pdf(urls, options) {
	let items = [];
	for (let url of urls) {
		items.push(await cleanup(url));
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
