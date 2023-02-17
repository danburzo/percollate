/*
	Page formats supported by CSS Paged Media. See:
	https://w3c.github.io/csswg-drafts/css-page/#typedef-page-size-page-size

	Mapped to 'format' when understood by Puppeteer:
	https://pptr.dev/api/puppeteer.lowercasepaperformat
	...otherwise mapped to size defined by CSS Paged Media.
 */
const CSS_PAGE_FORMATS = {
	a5: {
		format: 'a5'
		// width: '14.8cm',
		// height: '21cm'
	},
	a4: {
		format: 'a4'
		// width: '21cm',
		// height: '29.7cm'
	},
	a3: {
		format: 'a3'
		// width: '29.7cm',
		// height: '42cm'
	},
	b5: {
		// format: 'b5',
		width: '17.6cm',
		height: '25cm'
	},
	b4: {
		// format: 'b4',
		width: '25cm',
		height: '35.3cm'
	},
	'jis-b5': {
		width: '18.2cm',
		height: '25.7cm'
	},
	'jis-b4': {
		width: '25.7cm',
		height: '36.4cm'
	},
	letter: {
		format: 'letter'
		// width: '8.5in',
		// height: '11in'
	},
	legal: {
		format: 'legal'
		// width: '8.5in',
		// height: '14in'
	},
	ledger: {
		format: 'ledger'
		// width: '11in',
		// height: '17in'
	}
};

const CSS_LENGTH_UNITS = [
	// font-relative
	'em',
	'ex',
	'cap',
	'ch',
	'ic',
	'rem',
	'lh',
	'rlh',

	// viewport-relative
	'vw',
	'svw',
	'lvw',
	'dvw',
	'vh',
	'svh',
	'lvh',
	'dvh',
	'vi',
	'svi',
	'lvi',
	'dvi',
	'vb',
	'svb',
	'lvb',
	'dvb',
	'vmin',
	'svmin',
	'lvmin',
	'dvmin',
	'vmax',
	'svmax',
	'lvmax',
	'dvmax',

	// absolute
	'cm',
	'mm',
	'Q',
	'in',
	'pt',
	'pc',
	'px'
];

const CSS_LENGTH_REGEX = new RegExp(
	String.raw`^([^\s]+)(?:${CSS_LENGTH_UNITS.join('|')})$`
);

/*
	Checks whether given string is a CSS <length> value:
	https://w3c.github.io/csswg-drafts/css-values-4/#length-value
 */
export function isLength(str = '') {
	if (str === '0') {
		return true;
	}
	const m = str.trim().match(CSS_LENGTH_REGEX);
	if (m && parseFloat(m[1])) {
		return true;
	}
	return false;
}

/*
	Parse CSS value of `@page/size` property
	and return an object compatible with Puppeteer's 
	PDFOptions object (format, landscape, width, height).

	See: https://w3c.github.io/csswg-drafts/css-page/#page-size-prop

	TODO: 
		- size: auto
 */
export function pageSize(str) {
	const parts = (str || '')
		.toLowerCase()
		.trim()
		.split(/\s+/)
		.filter(p => p);
	if (parts.length === 1) {
		const first = parts[0];
		if (isLength(first)) {
			return {
				width: first,
				height: first
			};
		}
		return CSS_PAGE_FORMATS[first] || {};
	}
	if (parts.length === 2) {
		const [first, second] = parts;
		if (isLength(first) && isLength(second)) {
			return {
				width: first,
				height: second
			};
		}
		const format = CSS_PAGE_FORMATS[first];
		const landscape =
			second === 'landscape'
				? true
				: second === 'portrait'
				? false
				: null;
		if (!format || landscape === null) {
			return {};
		}
		return {
			...format,
			landscape
		};
	}
	return {};
}
