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
		img[data-lazy-src],
		img[data-lazy-srcset]
	`)
	).forEach(img => {
		['src', 'srcset', 'lazySrc', 'lazySrcset'].forEach(attr => {
			if (attr in img.dataset) {
				img.setAttribute(
					attr.replace(/^lazyS/, 's'),
					img.dataset[attr]
				);
			}
		});
	});

	Array.from(doc.querySelectorAll('[loading="lazy"]')).forEach(el => {
		el.removeAttribute('loading');
	});

	Array.from(doc.querySelectorAll('img[sizes]')).forEach(img => {
		img.removeAttribute('sizes');
	});
}

/*
	Replace:
		<a href='original-size.png'>
			<img src='small-size.png'/>
		</a>

	With:

		<img src='original-size.png'/>
*/
function imagesAtFullSize(doc) {
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

		/* 
			Handle cases where the `href` to the full-size image
			includes query parameters, eg. `image.png?w=1024`.
		*/
		let href = anchor.href;
		try {
			let url = new URL(anchor.href, doc.baseURI);
			url.search = '';
			href = url.href;
		} catch (err) {
			// no-op, probably due to bad `doc.baseURI`.
		}

		// Only replace if the `href` matches an image file
		if (
			include_pattern.test(href) &&
			!exclude_patterns.some(pattern => pattern.test(href))
		) {
			img.setAttribute('src', anchor.href);
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

function githubSpecific(doc) {
	/*
		Fix heading links
		See: https://github.com/danburzo/percollate/issues/49
	 */
	Array.from(
		doc.querySelectorAll('h1 > a, h2 > a, h3 > a, h4 > a, h5 > a, h6 > a')
	).forEach(el => {
		let id = el.id;
		if (id === el.getAttribute('href').replace(/^#/, 'user-content-')) {
			el.id = id.replace('user-content-', '');
			/*
				`aria-hidden` causes Readability to remove the element,
				so we remove the attribute.
			 */
			if (el.getAttribute('aria-hidden')) {
				el.removeAttribute('aria-hidden');
			}
		}
	});
}

/* 
	Mark some links as not needing their HREF appended.
*/
function noUselessHref(doc) {
	Array.from(doc.querySelectorAll('a'))
		.filter(function (el) {
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
		try {
			el.setAttribute(
				'srcset',
				absoluteSrcset(el.getAttribute('srcset'))
			);
		} catch (err) {
			console.error(err);
		}
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

/*
	Expands <details> elements
*/
function expandDetailsElements(doc) {
	Array.from(doc.querySelectorAll('details')).forEach(el =>
		el.setAttribute('open', true)
	);
}

/*
	Wrap <pre> blocks in <figure> elements,
	to make sure Readability preserves them.
 */
function wrapPreBlocks(doc) {
	Array.from(doc.querySelectorAll('pre')).forEach(pre => {
		if (pre.parentNode && !pre.parentNode.matches('figure')) {
			let fig = doc.createElement('figure');
			fig.appendChild(pre.cloneNode(true));
			/*
				If the <pre> is the only child (of a <div> or <p>),
				also remove this parent in the process.
			 */
			let to_replace = pre.matches(':only-child') ? pre.parentNode : pre;
			to_replace.parentNode.replaceChild(fig, to_replace);
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
	singleImgToFigure,
	expandDetailsElements,
	githubSpecific,
	wrapPreBlocks
};
