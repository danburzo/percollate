const slugify = require('slugify');

const DEFAULT_TITLE = 'Untitled page';
const OPTS = { strict: true };

module.exports = function (items, options, ext) {
	if (options.individual && options.output) {
		return (
			options.output.replace(/\.[^.]+$/g, '') +
			'-' +
			slugify(items[0].title || DEFAULT_TITLE, OPTS) +
			(ext || '')
		);
	}
	if (options.output) {
		return options.output;
	}
	if (items.length > 1) {
		return `percollate-${Date.now()}${ext || ''}`;
	}
	return slugify(items[0].title || DEFAULT_TITLE, OPTS) + (ext || '');
};
