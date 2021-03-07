const { PDFDocument } = require('pdf-lib');

/**
 * Adds exif data to a file
 * @param {Buffer} existingPdfBytes
 * @param {Object} metaData
 */
module.exports = async function addExif(existingPdfBytes, metaData) {
	const pdfDoc = await PDFDocument.load(existingPdfBytes, {
		updateMetadata: false
	});
	if (metaData.Title) {
		pdfDoc.setTitle(metaData.Title);
	}
	if (metaData.Author) {
		pdfDoc.setAuthor(metaData.Author);
	}
	return pdfDoc.save();
};
