import fs from 'node:fs';
import tape from 'tape';
import { pdf, epub, html, configure } from '../index.js';
import epubchecker from 'epubchecker';

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = new URL('percollate-output.pdf', import.meta.url);
const testPdfMultipleWebsites = new URL(
	'percollate-output-multiple-websites.pdf',
	import.meta.url
);
const testHtml = new URL('percollate-output.html', import.meta.url);
const testEpub = new URL('percollate-output.epub', import.meta.url);
const testWebtoHtml = new URL(
	'percollate-output-webToHtml.html',
	import.meta.url
);
const testHtmltoPdf = new URL(
	'percollate-output-htmlToPdf.pdf',
	import.meta.url
);

async function generateTestFiles() {
	await pdf([testUrl], {
		output: testPdf
	});
	await html([testUrl], {
		output: testHtml
	});
}

tape('files exists', async t => {
	configure();
	await generateTestFiles();
	t.true(fs.existsSync(testPdf));
	t.true(fs.existsSync(testHtml));
	t.pass();
});

tape('generate pdf with multiple websites', async t => {
	await pdf([testUrl, testUrl], {
		output: testPdfMultipleWebsites
	});
	t.true(fs.existsSync(testPdfMultipleWebsites));
});

tape('generates valid epub', async t => {
	configure();
	await epub([testUrl], {
		output: testEpub
	});

	t.true(fs.existsSync(testEpub));

	const report = await epubchecker(testEpub);
	t.equal(report.checker.nFatal, 0);
});

tape('website to html & html to pdf', async t => {
	configure();
	await html([testUrl], {
		output: testWebtoHtml
	});
	await pdf([testWebtoHtml], {
		output: testHtmltoPdf
	});
	t.pass();
});

tape('programmatic api result', async t => {
	configure();

	const resultNull = await pdf([], {
		output: testPdf
	});
	t.equal(resultNull, null, 'testing no urls provided');

	const result = await pdf([testUrl], {
		output: testPdf
	});

	t.true(result.items.length > 0, 'has results');
	t.equal(result.items[0].title, 'JavaScript', 'title is correct');
	t.true(
		result.items[0].originalContent.buffer.byteLength > 0,
		'has non-empty .originalContent.buffer ArrayBuffer'
	);
	t.ok(
		result.items[0].originalContent.hasOwnProperty('contentType'),
		'has .originalContent.contentType optional property'
	);
	t.true('options' in result, 'has .options object');
	t.equal(result.options.output, testPdf, 'has correct output path');
	t.pass();
});
