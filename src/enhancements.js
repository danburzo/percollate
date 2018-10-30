const srcset = require('srcset');
const URL = require('url').URL;
const replaceElementType = require('./replace-element-type');

/* 
	Convert AMP markup to HMTL markup
	(naive / incomplete implementation)
*/
function ampToHtml(doc) {
	// Convert <amp-img> to <img>
	Array.from(doc.querySelectorAll('amp-img')).forEach(ampImg => {
		replaceElementType(ampImg, 'img', doc);
	});
}

function fixLazyLoadedImages(doc) {
	Array.from(
		doc.querySelectorAll(`
		img[data-src], 
		img[data-srcset],
		img[data-sizes]
	`)
	).forEach(img => {
		['src', 'srcset', 'sizes'].forEach(attr => {
			if (attr in img.dataset) {
				img.setAttribute(attr, img.dataset[attr]);
			}
		});
	});
}

function imagesAtFullSize(doc) {
	/*
		Replace:
			<a href='original-size.png'>
				<img src='small-size.png'/>
			</a>

		With:
			<img src='original-size.png'/>
	 */
	let include_pattern = /\.(png|jpg|jpeg|gif|svg)$/i;
	let exclude_patterns = [
		/*
			Exclude Wikipedia links to image file pages
		*/
		/wiki\/File\:/,

		/* 
			Exclude images embedded in Markdown files
			hosted on github.com.
			See: https://github.com/danburzo/percollate/issues/84
		*/
		/github\.com/
	];

	Array.from(doc.querySelectorAll('a > img:only-child')).forEach(img => {
		let anchor = img.parentNode;
		let original = anchor.href;

		// only replace if the HREF matches an image file
		if (
			include_pattern.test(original) &&
			!exclude_patterns.some(pattern => pattern.test(original))
		) {
			img.setAttribute('src', original);
			anchor.parentNode.replaceChild(img, anchor);
		}
	});

	/*
		Remove width/height attributes from <img> elements
		and style them in CSS. (Should we do this, actually?)
	 */
	Array.from(doc.querySelectorAll('img')).forEach(img => {
		img.removeAttribute('width');
		img.removeAttribute('height');
	});
}

function wikipediaSpecific(doc) {
	/*
		Remove some screen-only things from wikipedia pages:
		- edit links next to headings
	 */
	Array.from(
		doc.querySelectorAll(`
			.mw-editsection
		`)
	).forEach(el => el.remove());
}

/* 
	Mark some links as not needing their HREF appended.
*/
function noUselessHref(doc) {
	Array.from(doc.querySelectorAll('a'))
		.filter(function(el) {
			let href = el.getAttribute('href') || '';

			// in-page anchors
			if (href.match(/^\#/)) {
				return true;
			}

			let textContent = el.textContent.trim();

			// links whose text content is the HREF
			// or which don't have any content.
			return !textContent || textContent === href;
		})
		.forEach(el => el.classList.add('no-href'));
}

/*
	Convert relative URIs to absolute URIs:
	
	* the `href` attribute of <a> elements (except for in-page anchors)
	* the `src` attribute of <img> elements
	* the `srcset` attribute of <source> elements (inside <picture> elements)
 */
function relativeToAbsoluteURIs(doc) {
	function absoluteSrcset(str) {
		return srcset.stringify(
			srcset.parse(str).map(item => ({
				...item,
				url: new URL(item.url, doc.baseURI).href
			}))
		);
	}

	Array.from(doc.querySelectorAll('a:not([href^="#"])')).forEach(el => {
		el.setAttribute('href', el.href);
	});

	Array.from(doc.querySelectorAll('img')).forEach(el => {
		el.setAttribute('src', el.src);
	});

	Array.from(
		doc.querySelectorAll('picture source[srcset], img[srcset]')
	).forEach(el => {
		el.setAttribute('srcset', absoluteSrcset(el.getAttribute('srcset')));
	});
}

/*
	Wraps single images into <figure> elements,
	adding the image's `alt` attribute as <figcaption>
 */
function singleImgToFigure(doc) {
	Array.from(doc.querySelectorAll('img:only-child')).forEach(image => {
		let fig = doc.createElement('figure');
		fig.appendChild(image.cloneNode());

		let alt = image.getAttribute('alt');
		if (alt) {
			let figcaption = doc.createElement('figcaption');
			figcaption.textContent = alt;
			fig.appendChild(figcaption);
		}

		// Replace paragraph with figure
		if (image.parentNode.matches('p') && image.parentNode.parentNode) {
			image.parentNode.parentNode.replaceChild(fig, image.parentNode);
		} else {
			image.parentNode.replaceChild(fig, image);
		}
	});
}

module.exports = {
	ampToHtml,
	fixLazyLoadedImages,
	imagesAtFullSize,
	noUselessHref,
	wikipediaSpecific,
	relativeToAbsoluteURIs,
	singleImgToFigure
};
