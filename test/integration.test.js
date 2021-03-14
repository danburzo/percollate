let tape = require('tape');
const fs = require('fs');
const percollate = require('..');
const epubchecker = require('epubchecker');

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = `${__dirname}/percollate-output.pdf`;
const testHtml = `${__dirname}/percollate-output.html`;
const testEpub = `${__dirname}/percollate-output.epub`;
const testWebtoHtml = `${__dirname}/percollate-output-webToHtml.html`;
const testHtmltoPdf = `${__dirname}/percollate-output-htmlToPdf.pdf`;

async function generateTestFiles() {
	await percollate.pdf([testUrl], {
		output: testPdf
	});
	await percollate.html([testUrl], {
		output: testHtml
	});
}

tape('files exists', async t => {
	percollate.configure();
	await generateTestFiles();
	t.true(fs.existsSync(testPdf));
	t.true(fs.existsSync(testHtml));
	t.pass();
});

tape('generates valid epub', async t => {
	percollate.configure();
	await percollate.epub([testUrl], {
		output: testEpub
	});

	t.true(fs.existsSync(testEpub));

	const report = await epubchecker(testEpub);
	t.equal(report.checker.nFatal, 0);
});

tape('website to html & html to pdf', async t => {
	percollate.configure();
	await percollate.html([testUrl], {
		output: testWebtoHtml
	});
	await percollate.pdf([testWebtoHtml], {
		output: testHtmltoPdf
	});
	t.pass();
});

tape('programmatic api result', async t => {
	percollate.configure();
	const test = await percollate.pdf([testUrl], {
		output: testPdf
	});
	t.true(test.items.length > 0);
	t.equal(test.items[0].title, 'JavaScript');
	t.true('html' in test.items[0]);
	t.true(test.items[0].html.length > 0);
	t.true('options' in test);
	t.equal(test.options.output, testPdf);
	t.pass();
});
