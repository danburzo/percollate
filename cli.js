#!/usr/bin/env node
const program = require('commander');
const pkg = require('./package.json');

const { configure, pdf, epub, html } = require('.');

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
		.option('--css [style]', 'Additional CSS style')
		.option('--individual', 'Export each web page as an individual file')
		.option('--no-amp', "Don't use the AMP version when available");
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

// with_common_options(
// 	program.command('', 'default command', { isDefault: true })
// ).action(() => {
// 	program.outputHelp();
// });

program.on('--help', () => {
	console.log(`
Examples:
  Transform single web page to PDF
    $ percollate pdf --output some.pdf https://example.com
  Transform several web pages to a single PDF
    $ percollate pdf --output some.pdf https://example.com/page1 https://example.com/page2
  Custom page size and font size
    $ percollate pdf --output some.pdf --css "@page { size: A3 landscape } html { font-size: 18pt }" https://example.com
`);
});

program.parse(process.argv);

// Show help by default when no arguments provided
if (!program.args.length) {
	program.outputHelp();
}
