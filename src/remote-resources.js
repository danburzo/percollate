import { randomUUID as uuid } from 'node:crypto';
import { parseSrcset, stringifySrcset } from 'srcset';
import { REGEX_IMAGE_URL } from './constants/regex.js';
import { getUrlOrigin } from './util/url-origin.js';

export default function remoteResources(doc) {
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
		let match = pathname.match(REGEX_IMAGE_URL);
		if (!match) {
			return src;
		}
		if (!srcs.has(src)) {
			srcs.set(src, {
				original: src,
				mapped: `rr-${uuid()}.${match[1]}`,
				origin: getUrlOrigin(doc.baseURI)
			});
		}
		return `./${srcs.get(src).mapped}`;
	}

	Array.from(doc.querySelectorAll('picture source[src], img[src]')).forEach(
		el => {
			el.setAttribute('src', collectAndReplace(el.src));
		}
	);

	Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).forEach(el => {
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
			return;
		}
		try {
			el.setAttribute(
				'srcset',
				stringifySrcset(
					parseSrcset(el.getAttribute('srcset')).map(item => ({
						...item,
						url: collectAndReplace(item.url)
					}))
				)
			);
		} catch (err) {
			console.error(err);
		}
	});
	return Array.from(srcs.values());
}
