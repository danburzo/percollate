import { parseSrcset, stringifySrcset } from 'srcset';
import { getMimetypeFromURL, isImageURL } from './util/file-mimetype.js';
import fetchBase64 from './util/fetch-base64.js';

export default async function inlineImages(doc, fetchOptions = {}, out) {
	if (out) {
		out.write('Inlining images...\n');
	}
	let src_promises = Array.from(
		doc.querySelectorAll('picture source[src], img[src]')
	).map(async el => {
		/*
			For web pages using atypical URLs for images
			let’s just use a generic MIME type and hope it works.
			
			For an example, see:
			https://github.com/danburzo/percollate/issues/174
		*/
		let mime = isImageURL(el.src, doc)
			? getMimetypeFromURL(el.src, doc)
			: 'image';
		if (out) {
			out.write(el.src + '\n');
		}
		let data = await fetchBase64(el.src, fetchOptions);
		el.dataset.originalSrc = el.getAttribute('src');
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
			const srcset = el.getAttribute('srcset');
			const items = parseSrcset(srcset);
			el.dataset.originalSrcset = srcset;
			el.setAttribute(
				'srcset',
				stringifySrcset(
					await Promise.all(
						items.map(async item => {
							/*
								For web pages using atypical URLs for images
								let’s just use a generic MIME type and hope it works.
								
								For an example, see:
								https://github.com/danburzo/percollate/issues/174
							*/
							let mime = isImageURL(item.url, doc)
								? getMimetypeFromURL(item.url, doc)
								: 'image';
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
