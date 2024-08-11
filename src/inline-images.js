import { parseSrcset, stringifySrcset } from 'srcset';
import { lookupMimetype, imageMimetypes } from './util/file-mimetype.js';
import fetchBase64 from './util/fetch-base64.js';

function get_mime(src, doc) {
	let pathname = src;
	try {
		pathname = new URL(src, doc.baseURI).pathname;
	} catch (err) {
		// no-op, probably due to bad `doc.baseURI`
	}
	return lookupMimetype(pathname);
}

export default async function inlineImages(doc, fetchOptions = {}, out) {
	if (out) {
		out.write('Inlining images...\n');
	}
	let src_promises = Array.from(
		doc.querySelectorAll('picture source[src], img[src]')
	).map(async el => {
		let mime = get_mime(el.src, doc);
		/*
			For web pages using atypical URLs for images
			let’s just use a generic MIME type and hope it works.
			
			For an example, see:
			https://github.com/danburzo/percollate/issues/174
		*/
		if (!mime || !imageMimetypes.has(mime)) {
			mime = 'image';
		}
		if (out) {
			out.write(el.src + '\n');
		}
		let data = await fetchBase64(el.src, fetchOptions);
		el.setAttribute('src', `data:${mime};base64,${data}`);
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
							let mime = get_mime(item.url, doc);

							/*
								For web pages using atypical URLs for images
								let’s just use a generic MIME type and hope it works.
								
								For an example, see:
								https://github.com/danburzo/percollate/issues/174
							*/
							if (!mime || !imageMimetypes.has(mime)) {
								mime = 'image';
							}
							let data = await fetchBase64(
								item.url,
								fetchOptions
							);
							return {
								...item,
								url: `data:${mime};base64,${data}`
							};
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
