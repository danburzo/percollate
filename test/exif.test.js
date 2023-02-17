import fs from 'node:fs';
import tape from 'tape';
import { PDFDocument } from 'pdf-lib';
import { pdf, configure } from '../index.js';

const testUrl = 'https://de.wikipedia.org/wiki/JavaScript';
const testPdf = new URL('percollate-output-exif.pdf', import.meta.url);
const testPdfMultiple = new URL(
	'percollate-output-exif-multiple.pdf',
	import.meta.url
);

async function generateTestFiles() {
	await pdf([testUrl], {
		output: testPdf
	});
	await pdf([testUrl, testUrl], {
		output: testPdfMultiple
	});
}

tape('exif feature test', async t => {
	configure();
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
