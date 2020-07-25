#!/usr/bin/env node
const pkg = require('./package.json');
const cliopts = require('./cli-opts');

const { configure, pdf, epub, html } = require('./index');

const { command, opts, operands } = cliopts(process.argv.slice(2), outputHelp);

/*
	Some setup
	----------
 */
configure();

if (opts.version) {
	outputVersion();
}

if (opts.help) {
	outputHelp();
}

if (!command || !operands.length) {
	outputHelp();
}

if (opts.debug) {
	console.log({
		command,
		operands,
		opts
	});
}

switch (command) {
	case 'pdf':
		pdf(operands, opts);
		break;
	case 'epub':
		epub(operands, opts);
		break;
	case 'html':
		html(operands, opts);
		break;
}

/*
	Help & version
	--------------
 */

function outputHelp() {
	console.log(
		`percollate v${pkg.version}

Usage: percollate <command> [options] url [url]...

Commands:

  pdf                Bundle web pages as a PDF file
  epub               Bundle web pages as an EPUB file.
  html               Bundle web pages as a HTML file.

Commmon options:

  -h, --help         Output usage information.
  -V, --version      Output program version.
  --debug            Print more detailed information.

  -o <output>,       Path for the generated bundle.
  --output=<path>  
  --template=<path>  Path to a custom HTML template.
  --style=<path>     Path to a custom CSS file.
  --css=<style>      Additional inline CSS style.
  -u, --url=<url>    Sets the base URL when HTML is provided on stdin.
                     Multiple URL options can be specified.
  --individual       Export each web page as an individual file.
  --no-amp           Don't prefer the AMP version of the web page.
  --toc              Generate a Table of Contents.

PDF options: 

  --no-sandbox       Passed to Puppeteer.

Operands:

  percollate accepts one or more URLs.
  
  Use the hyphen character ('-') to specify 
  that the HTML should be read from stdin.

Examples:

  Single web page to PDF:

    percollate pdf --output my.pdf https://example.com

  Single web page read from stdin to PDF:

    curl https://example.com | percollate pdf -o my.pdf -u https://example.com -
  
  Several web pages to a single PDF:

    percollate pdf --output my.pdf https://example.com/1 https://example.com/2
  
  Custom page size and font size:
    
    percollate pdf --output my.pdf --css "@page { size: A3 landscape } html { font-size: 18pt }" https://example.com
`
	);
	process.exit(0);
}

function outputVersion() {
	console.log(pkg.version);
	process.exit(0);
}
