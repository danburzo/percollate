import fetch from 'node-fetch';
import srcset from 'srcset';
import mimetype from './util/mimetype.js';

const image_mimetypes = new Set([
	'image/avif',
	'image/bmp',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/webp'
]);

function get_mime(src, doc) {
	let pathname = src;
	try {
		pathname = new URL(src, doc.baseURI).pathname;
	} catch (err) {
		// no-op, probably due to bad `doc.baseURI`
	}
	return mimetype(pathname);
}

function to_base64(url, opts) {
	return fetch(url, opts)
		.then(r => r.buffer())
		.then(buff => buff.toString('base64'));
}

export default async function inlineImages(doc, fetchOptions = {}) {
	Array.from(doc.querySelectorAll('picture source[src], img[src]')).forEach(
		async el => {
			const mime = get_mime(el.src, doc);
			if (mime && image_mimetypes.has(mime)) {
				let data = await to_base64(el.src, fetchOptions);
				el.setAttribute('src', `data:${mime};base64,${data}`);
			}
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
			const items = srcset.parse(el.getAttribute('srcset'));
			el.setAttribute(
				'srcset',
				srcset.stringify(
					items.map(async item => {
						const mime = get_mime(item.url, doc);
						if (mime && image_mimetypes.has(mime)) {
							let data = await to_base64(item.url, fetchOptions);
							return {
								...item,
								url: `data:${mime};base64,${data}`
							};
						}
						return item;
					})
				)
			);
		} catch (err) {
			console.error(err);
		}
	});
}
