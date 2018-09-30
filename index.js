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

nunjucks.configure('templates', { autoescape: false, noCache: true });

async function handle(url) {

	console.log(`Fetching: ${url}`);
	const content = (await got(url)).body;

	console.log('Parsing DOM');
	const doc = new JSDOM(content).window.document;

	console.log('Enhancing');
	imagesAtFullSize(doc);

	console.log('Running through Readability');
	const metadata = new readability(doc).parse();

	console.log('Generating HTML');
	const html = nunjucks.render('default.html', metadata);

	var temp_file = tmp.tmpNameSync({
		postfix: '.html'
	});
	console.log(`Writing to temporary file: ${temp_file}`);
	fs.writeFileSync(temp_file, html);

	console.log('Opening Puppeteer');
	const browser = await pup.launch({
		headless: true
	});
	const page = await browser.newPage();
	await page.goto(`file://${temp_file}`, { waitUntil: 'load' });

	console.log('Generating PDF');
	await page.pdf({ path: `${metadata.title}.pdf`, format: 'A5', margin: { top: '1cm', left: '1cm', right: '1cm', bottom: '2cm' } });

	await browser.close();
};

prog
	.version(pkg.version)
	.argument('[urls...]', "List of URLs to bundle")
	.action(function(args, options) {
		args.urls.forEach(handle);
	})

prog.parse(process.argv);
