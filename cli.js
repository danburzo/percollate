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

with_common_options(
	program.command('', 'default command', { isDefault: true })
).action(() => {
	program.outputHelp();
});

program.parse(process.argv);

// Show help by default when no arguments provided
if (!program.args.length) {
	program.outputHelp();
}
