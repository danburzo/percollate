import slugify from 'slugify';

const DEFAULT_TITLE = 'Untitled page';
const OPTS = { strict: true };

function slugifyTitle(title, cache = {}) {
	const res =
		slugify(title || DEFAULT_TITLE, OPTS) || `percollate-${Date.now()}`;
	if (cache[res] !== undefined) {
		cache[res] += 1;
		return `${res}-${cache[res]}`;
	}
	cache[res] = 0;
	return res;
}

export default function (items, options = {}, ext, cache = {}) {
	if (options.individual && options.output) {
		return (
			// coerce URL to string
			(options.output + '').replace(/\.[^.]+$/g, '') +
			'-' +
			slugifyTitle(items[0].title, cache) +
			(ext || '')
		);
	}
	if (options.output) {
		return options.output;
	}
	if (!items.length || items.length > 1) {
		return `percollate-${Date.now()}${ext || ''}`;
	}
	return slugifyTitle(items[0].title, cache) + (ext || '');
}
