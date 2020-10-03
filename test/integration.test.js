let tape = require('tape');
const fs = require('fs');
const percollate = require('..');

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = `${__dirname}/test.pdf`;
const testHtml = `${__dirname}/test.html`;
const testEpub = `${__dirname}/test.epub`;
const testWebtoHtml = `${__dirname}/testWebToHtml.html`;
const testHtmltoPdf = `${__dirname}/testHtmlToPdf.pdf`;

async function generateTestFiles() {
	await percollate.pdf([testUrl], {
		output: testPdf
	});
	await percollate.html([testUrl], {
		output: testHtml
	});
	await percollate.epub([testUrl], {
		output: testEpub
	});
}

tape('files exists', async t => {
	percollate.configure();
	await generateTestFiles();
	t.true(fs.existsSync(testPdf));
	t.true(fs.existsSync(testHtml));
	t.true(fs.existsSync(testEpub));
	t.pass();
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
