import mimetype from 'mimetype';

/*
	Add newer image formats to the MIME type database.
 */
mimetype.set('.webp', 'image/webp');
mimetype.set('.avif', 'image/avif');

export function lookupMimetype(filepath) {
	return mimetype.lookup(filepath);
}

export function extForMimetype(type) {
	return Object.entries(mimetype.catalog).find(it => it[1] === type)?.[0];
}

export function getMimetypeFromURL(src, doc) {
	let pathname = src;
	try {
		pathname = new URL(src, doc.baseURI).pathname;
	} catch (err) {
		// no-op, probably due to bad `doc.baseURI`
	}
	return lookupMimetype(pathname);
}

export function isImageURL(src, doc) {
	return imageMimetypes.has(getMimetypeFromURL(src, doc));
}

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
