#!/usr/bin/env node
const program = require('commander');
const pkg = require('./package.json');

const { configure, cleanup, bundle } = require('.');


/*
	Some setup
	----------
 */
configure();


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
