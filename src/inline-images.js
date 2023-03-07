import { parseSrcset, stringifySrcset } from 'srcset';
import fileMimetype from './util/file-mimetype.js';
import fetchBase64 from './util/fetch-base64.js';

/* 
	Note: it is unfortunate that we use two separate mechanisms
	to discern when an URL points to an image, but here we are.

	`image_mimetypes` here needs to be kept in sync with the
	`REGEX_IMAGE_URL` constant!
*/
const image_mimetypes = new Set([
	'image/avif',
	'image/bmp',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/tiff',
	'image/webp'
]);

function get_mime(src, doc) {
	let pathname = src;
	try {
		pathname = new URL(src, doc.baseURI).pathname;
	} catch (err) {
		// no-op, probably due to bad `doc.baseURI`
	}
	return fileMimetype(pathname);
}

export default async function inlineImages(doc, fetchOptions = {}, out) {
	if (out) {
		out.write('Inlining images...\n');
	}
	let src_promises = Array.from(
		doc.querySelectorAll('picture source[src], img[src]')
	).map(async el => {
		const mime = get_mime(el.src, doc);
		if (mime && image_mimetypes.has(mime)) {
			if (out) {
				out.write(el.src + '\n');
			}
			let data = await fetchBase64(el.src, fetchOptions);
			el.setAttribute('src', `data:${mime};base64,${data}`);
		}
	});

	let srcset_promises = Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).map(async el => {
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
			const items = parseSrcset(el.getAttribute('srcset'));
			el.setAttribute(
				'srcset',
				stringifySrcset(
					await Promise.all(
						items.map(async item => {
							const mime = get_mime(item.url, doc);
							if (mime && image_mimetypes.has(mime)) {
								let data = await fetchBase64(
									item.url,
									fetchOptions
								);
								return {
									...item,
									url: `data:${mime};base64,${data}`
								};
							}
							return item;
						})
					)
				)
			);
		} catch (err) {
			console.error(err);
		}
	});
	return Promise.all(src_promises.concat(srcset_promises));
}
