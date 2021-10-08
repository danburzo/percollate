import mimetype from 'mimetype';

mimetype.set('.webp', 'image/webp');
mimetype.set('.avif', 'image/avif');

export default function lookup(filepath) {
	return mimetype.lookup(filepath);
}
