import mimetype from 'mimetype';

/*
	Add newer image formats to the MIME type database.
 */
mimetype.set('.webp', 'image/webp');
mimetype.set('.avif', 'image/avif');

export function lookupMimetype(filepath) {
	return mimetype.lookup(filepath);
}

export function extForMimetype(mimetype) {
	return Object.entries(mimetype.catalog).find(it => it[1] === mimetype)?.[0];
}

/* 
	Note: it is unfortunate that we use two separate mechanisms
	to discern when an URL points to an image, but here we are.

	`imageMimetypes` here needs to be kept in sync with the
	`REGEX_IMAGE_URL` constant!
*/
export const imageMimetypes = new Set([
	'image/avif',
	'image/bmp',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/tiff',
	'image/webp'
]);
