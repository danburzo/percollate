let tape = require('tape');
const fs = require('fs');
const percollate = require('..');
const epubchecker = require('epubchecker');

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = `${__dirname}/percollate-output.pdf`;
const testPdfMultipleWebsites = `${__dirname}/percollate-output-multiple-websites.pdf`;
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

tape('generate pdf with multiple websites', async t => {
	await percollate.pdf([testUrl, testUrl], {
		output: testPdfMultipleWebsites
	});
	t.true(fs.existsSync(testPdfMultipleWebsites));
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

	const resultNull = await percollate.pdf([], {
		output: testPdf
	});
	t.equal(resultNull, null, 'testing no urls provided');

	const result = await percollate.pdf([testUrl], {
		output: testPdf
	});
	t.true(result.items.length > 0);
	t.equal(result.items[0].title, 'JavaScript');
	t.true('originalContent' in result.items[0]);
	t.true(result.items[0].originalContent.length > 0);
	t.true('options' in result);
	t.equal(result.options.output, testPdf);
	t.pass();
});
