const srcset = require('srcset');
const URL = require('url').URL;

function imagesAtFullSize(doc) {
	/*
		Replace:
			<a href='original-size.png'>
				<img src='small-size.png'/>
			</a>

		With:
			<img src='original-size.png'/>
	 */
	Array.from(doc.querySelectorAll('a > img:only-child')).forEach(img => {
		let anchor = img.parentNode;
		let original = anchor.href;

		// only replace if the HREF matches an image file
		// and exclude wikipedia links to image file pages
		if (
			original.match(/\.(png|jpg|jpeg|gif|svg)$/i) &&
			!original.match(/wiki\/File\:/)
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
	Mark some links as not needing their HREF appended:
	- links whose text content is the HREF
	- in-page anchors
*/
function noUselessHref(doc) {
	Array.from(doc.querySelectorAll('a'))
		.filter(function(el) {
			return (
				(el.getAttribute('href') || '').match(/^\#/) ||
				el.getAttribute('href') === el.textContent.trim()
			);
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
	imagesAtFullSize,
	noUselessHref,
	wikipediaSpecific,
	relativeToAbsoluteURIs,
	singleImgToFigure
};
