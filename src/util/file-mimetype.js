import mimetype from 'mimetype';

/*
	Add newer image formats to the MIME type database.
 */
mimetype.set('.webp', 'image/webp');
mimetype.set('.avif', 'image/avif');

export default function lookup(filepath) {
	return mimetype.lookup(filepath);
}
