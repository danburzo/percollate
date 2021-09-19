const srcset = require('srcset');
const { v1: uuid } = require('uuid');

module.exports = function remoteResources(doc) {
	let srcs = new Map();

	/*
		Collect image sources so that later they can be fetched,
		and return a uniquely generated file name instead.
	 */
	function collectAndReplace(src) {
		let pathname = src;
		try {
			pathname = new URL(src, doc.baseURI).pathname;
		} catch (err) {
			// no-op, probably due to bad `doc.baseURI`.
		}
		let match = pathname.match(/\.(gif|jpe?g|png|svg|webp)$/);
		if (!match) {
			return src;
		}
		if (!srcs.has(src)) {
			srcs.set(src, `rr-${uuid()}.${match[1]}`);
		}
		return `./${srcs.get(src)}`;
	}

	Array.from(doc.querySelectorAll('img[src]')).forEach(el => {
		el.setAttribute('src', collectAndReplace(el.src));
	});

	Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).forEach(el => {
		try {
			if (el.getAttribute('src')) {
				/* 
					If a `src` is present on the <img>/<source> element, 
					let's use that instead of fetching all the images 
					defined in the `srcset`, which may increase the size
					of the EPUB file.

					This is a stop-gap solution until we figure out
					a more sophisticated way of telling which image 
					out of the set has the best quality.
				*/
				el.removeAttribute('srcset');
			} else {
				el.setAttribute(
					'srcset',
					srcset.stringify(
						srcset.parse(el.getAttribute('srcset')).map(item => ({
							...item,
							url: collectAndReplace(item.url)
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
