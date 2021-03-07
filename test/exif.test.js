let tape = require('tape');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const percollate = require('..');

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = `${__dirname}/percollate-output-exif.pdf`;
const testPdfMultiple = `${__dirname}/percollate-output-exif-multiple.pdf`;

async function generateTestFiles() {
	await percollate.pdf([testUrl], {
		output: testPdf
	});
	await percollate.pdf([testUrl, testUrl], {
		output: testPdfMultiple
	});
}

tape('exif feature test', async t => {
	percollate.configure();
	await generateTestFiles();

	t.true(fs.existsSync(testPdf));
	const file = fs.readFileSync(testPdf);
	const pdfDocument = await PDFDocument.load(file);
	t.same(pdfDocument.getTitle(), 'JavaScript', 'test exif title');
	t.same(
		pdfDocument.getAuthor(),
		'Autoren der Wikimedia-Projekte',
		'test exif author'
	);

	t.true(fs.existsSync(testPdfMultiple));
	const file2 = fs.readFileSync(testPdfMultiple);
	const pdfDocument2 = await PDFDocument.load(file2);
	t.same(pdfDocument2.getTitle(), 'Untitled', 'test exif title');
	t.same(pdfDocument2.getAuthor(), undefined, 'test exif author');

	t.pass();
});
