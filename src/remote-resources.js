import { randomUUID as uuid } from 'node:crypto';
import { parseSrcset, stringifySrcset } from 'srcset';
import {
	getMimetypeFromURL,
	extForMimetype,
	isImageURL
} from './util/file-mimetype.js';
import { getURLOrigin } from './util/url.js';

export default function remoteResources(doc) {
	let srcs = new Map();

	/*
		Collect image sources so that later they can be fetched,
		and return a uniquely generated file name instead.
	 */
	function collectAndReplace(src) {
		/*
			If image URLs don’t have an extension with which
			to figure out the image format, use the generic
			`image` MIME media type and the `.image` extension
			for EPUB remote resources.
		*/
		let mime = 'image',
			ext = '.image';
		if (isImageURL(src, doc)) {
			mime = getMimetypeFromURL(src, doc);
			ext = extForMimetype(mime);
		}
		if (!srcs.has(src)) {
			srcs.set(src, {
				original: src,
				mapped: `rr-${uuid()}${ext}`,
				origin: getURLOrigin(doc.baseURI),
				mimetype: mime
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
