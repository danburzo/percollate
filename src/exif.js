const util = require('util');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

/**
 * Adds exif data to a file
 * @param {object} metaData
 * @param {string} filePath
 */
module.exports = async function addExif(metaData, filePath) {
	const readFile = util.promisify(fs.readFile);
	const existingPdfBytes = await readFile(filePath);

	const pdfDoc = await PDFDocument.load(existingPdfBytes, {
		updateMetadata: false
	});

	pdfDoc.setTitle(metaData.Title);
	pdfDoc.setAuthor(metaData.Author);

	const pdfBytes = await pdfDoc.save();

	const writeFile = util.promisify(fs.writeFile);
	await writeFile(filePath, pdfBytes);
};
