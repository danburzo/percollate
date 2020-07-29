const srcset = require('srcset');
const uuid = require('uuid/v1');

module.exports = function remoteResources(doc) {
	let srcs = new Map();

	function replace(src) {
		let m;
		if ((m = src.match(/\.(gif|jpe?g|png|svg)$/))) {
			if (srcs.has(src)) {
				return src;
			} else {
				let new_src = `${uuid()}.${m[1]}`;
				srcs.set(src, new_src);
				return `./${new_src}`;
			}
		}
	}

	Array.from(doc.querySelectorAll('img')).forEach(el => {
		el.setAttribute('src', replace(el.src));
	});

	Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).forEach(el => {
		el.setAttribute(
			'srcset',
			srcset.stringify(
				srcset
					.parse(el.getAttribute('srcset'))
					.map(item => replace(item.url))
			)
		);
	});
	return Array.from(srcs.entries());
};
