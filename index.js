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
const { imagesAtFullSize } = require('./src/enhancements');

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
	const doc = new JSDOM(content).window.document;

	/* 
		Run enhancements
		----------------
	*/
	imagesAtFullSize(doc);

	// Run through readability and return
	return new readability(doc).parse();
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

	const html = nunjucks.render(resolve(options.template || './templates/default.html'), {
		items: items,
		stylesheet: resolve(options.stylesheet || './templates/default.css')
	});

	fs.writeFileSync(temp_file, html);

	console.log('Saving as PDF');
	const browser = await pup.launch({
		headless: true
	});
	const page = await browser.newPage();
	await page.goto(`file://${temp_file}`, { waitUntil: 'load' });

	await page.pdf({
		path: options.output,
		format: 'A5',
		margin: { top: '1cm', left: '1cm', right: '1cm', bottom: '2cm' }
	});

	await browser.close();
}

/*
	Command-Line Interface definition
	---------------------------------
 */

program.version(pkg.version);

program
	.command('pdf [urls...]')
	.option('-o, --output [output]', 'Path for the generated PDF')
	.option('-t, --template [template]', 'Path to custom HTML template')
	.option('-s, --style [stylesheet]', 'Path to custom CSS')
	.action(pdf);

program
	.command('epub [urls...]')
	.option('-o, --output [output]', 'Path for the generated EPUB')
	.option('-t, --template [template]', 'Path to custom HTML template')
	.option('-s, --style [stylesheet]', 'Path to custom CSS')
	.action(epub);

program
	.command('html [urls...]')
	.option('-o, --output [output]', 'Path for the generated HTML')
	.option('-t, --template [template]', 'Path to custom HTML template')
	.option('-s, --style [stylesheet]', 'Path to custom CSS')
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
