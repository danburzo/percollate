const exiftoolBin = require('dist-exiftool');
const exiftool = require('node-exiftool');

/**
 * Adds exif data to a file
 * @param {object} metaData
 * @param {string} filePath
 */
module.exports = async function addExif(metaData, filePath) {
	const ep = new exiftool.ExiftoolProcess(exiftoolBin);

	try {
		await ep.open();
		await ep.writeMetadata(filePath, metaData);
	} catch (error) {
		throw error;
	} finally {
		ep.close();
	}
	return metaData;
};
