#!/usr/bin/env node
const prog = require('caporal');
const pkg = require('./package.json');
const pup = require('puppeteer');
const readability = require('./vendor/readability');
const got = require('got');
const { JSDOM } = require('jsdom');
const nunjucks = require('nunjucks');
const tmp = require('tmp');
const fs = require('fs');
const { imagesAtFullSize } = require('./src/enhancements');

/*
	Some setup
	----------
 */
nunjucks.configure('templates', { autoescape: false, noCache: true });

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
async function bundle(items, output_path) {
	var temp_file = tmp.tmpNameSync({
		postfix: '.html'
	});

	console.log(`Generating temporary HTML file at: ${temp_file}`);

	const html = nunjucks.render('default.html', {
		items: items
	});

	fs.writeFileSync(temp_file, html);

	console.log('Saving as PDF');
	const browser = await pup.launch({
		headless: true
	});
	const page = await browser.newPage();
	await page.goto(`file://${temp_file}`, { waitUntil: 'load' });

	await page.pdf({
		path: output_path,
		format: 'A5',
		margin: { top: '1cm', left: '1cm', right: '1cm', bottom: '2cm' }
	});

	await browser.close();
}

/*
	Command-Line Interface definition
	---------------------------------
 */

prog.version(pkg.version)
	.argument('<urls...>', 'One or more URLs to bundle')
	.option('-o, --output [path]', 'Path for the generated PDF')
	.action(run);

prog.parse(process.argv);

/*
	Main action
	-----------
 */
async function run(args, options) {
	let items = [];
	for (let url of args.urls) {
		items.push(await cleanup(url));
	}
	bundle(items, options.output);
}
