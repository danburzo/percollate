const srcset = require('srcset');
const { v1: uuid } = require('uuid');

module.exports = function remoteResources(doc) {
	let srcs = new Map();

	function replace(src) {
		let cleanSrc = src.split('?')[0];
		let match;
		if ((match = cleanSrc.match(/\.(gif|jpe?g|png|svg|webp)(\/)?$/))) {
			if (!srcs.has(cleanSrc)) {
				let new_src = `rr-${uuid()}.${match[1]}`;
				srcs.set(cleanSrc, new_src);
			}
			return `./${srcs.get(cleanSrc)}`;
		}
		return src;
	}

	Array.from(doc.querySelectorAll('img')).forEach(el => {
		el.setAttribute('src', replace(el.src));
	});

	Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).forEach(el => {
		try {
			if (el.getAttribute('src')) {
				el.removeAttribute('srcset');
			} else {
				el.setAttribute(
					'srcset',
					srcset.stringify(
						srcset.parse(el.getAttribute('srcset')).map(item => ({
							...item,
							url: replace(item.url)
						}))
					)
				);
			}
		} catch (err) {
			console.error(err);
		}
	});
	return Array.from(srcs.entries());
};
