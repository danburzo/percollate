import { randomUUID as uuid } from 'node:crypto';

import { Readability } from '@mozilla/readability';
import createDOMPurify from 'dompurify';

import { hyphenateDom } from './hyphenate.js';
import { textToIso6391, getLanguageAttribute } from './util/language.js';
import { getUrlOrigin } from './util/url-origin.js';
import { setIdsAndReturnHeadings, nestHeadings } from './headings.js';

import {
	ampToHtml,
	fixLazyLoadedImages,
	imagesAtFullSize,
	wikipediaSpecific,
	noUselessHref,
	relativeToAbsoluteURIs,
	singleImgToFigure,
	expandDetailsElements,
	githubSpecific,
	wrapPreBlocks
} from './enhancements.js';
import mapRemoteResources from './remote-resources.js';
import inlineImages from './inline-images.js';

/*

	The `parsedContent` can be populated, e.g. from feed entries.
	The following structure is required:

	{
		content: JSDOM instance,
		title: 
		byline:
		dir: 
		excerpt:
		length:
		siteName:
	}

*/
export default async function cleanupItem(
	dom,
	options,
	parsedContent = null,
	env
) {
	const doc = dom.window.document;
	const url = dom.window.location.href;

	const sanitizer = createDOMPurify(dom.window);

	// Force relative URL resolution
	doc.body.setAttribute(null, null);

	/* 
		Run DOM enhancements
	*/
	env.err.write(`Enhancing web page: ${url}`);
	enhancePage(doc);

	let parsed;

	if (parsedContent) {
		parsed = parsedContent;
	} else {
		/*
			Run through Readability
		*/
		const R = new Readability(doc, {
			classesToPreserve: [
				'no-href',
				// Placed on some <a> elements as in-page anchors
				'anchor'
			],
			/*
				Change Readability's serialization to return 
				a DOM element (instead of a HTML string) 
				as the `.content` property returned from `.parse()`

				This makes it easier for us to run subsequent
				transformations (sanitization, hyphenation, etc.)
				without having to parse/serialize the HTML repeatedly.
			 */
			serializer: el => el
		});

		// TODO: find better solution to prevent Readability from
		// making img srcs relative.
		if (options.mapRemoteResources || options.inline) {
			R._fixRelativeUris = () => {};
		}

		parsed = R.parse() || {};
	}

	const remoteResources = options.mapRemoteResources
		? mapRemoteResources(parsed.content)
		: null;

	const textContent = sanitizer.sanitize(
		parsed.textContent || parsed.content.textContent
	);
	const lang = getLanguageAttribute(doc) || textToIso6391(textContent);

	env.err.write(' ✓\n');

	if (options.inline) {
		await inlineImages(
			parsed.content,
			{
				headers: {
					'user-agent': env.UA
				},
				/*
					Send the referrer as the browser would 
					when fetching the image to render it.

					The referrer policy would take care of 
					stripping the URL down to its origin, 
					but just in case, let’s strip it ourselves.
				*/
				referrer: getUrlOrigin(url),
				referrerPolicy: 'strict-origin-when-cross-origin',
				timeout: 10 * 1000
			},
			options.debug ? env.out : undefined
		);
	}

	/*
		Select the appropriate serialization method
		based on the bundle target. EPUBs need the 
		content to be XHTML (produced by a XML serializer),
		rather than normal HTML.
	 */
	const serializer = options.xhtml
		? arr => {
				const xs = new dom.window.XMLSerializer();
				return arr.map(el => xs.serializeToString(el)).join('');
		  }
		: arr => arr.map(el => el.innerHTML).join('');

	/*
		When dompurify returns a DOM node, it always wraps it 
		in a HTMLBodyElement. We only need its children.
	 */
	const sanitize_to_dom = dirty =>
		Array.from(sanitizer.sanitize(dirty, { RETURN_DOM: true }).children);

	const content_els = sanitize_to_dom(parsed.content);

	// `--toc-level` implies `--toc`, unless disabled with `--no-toc`.
	let headings = [];
	if (options['toc-level'] > 1 && options.toc !== false) {
		headings = setIdsAndReturnHeadings(
			content_els,
			options['toc-level']
		).map(heading => {
			return {
				id: heading.id,
				level: heading.level,
				// Plain text used in EPUB
				text: heading.node.textContent.trim(),
				// Sanitized marked-up text used in HTML/PDF
				content: serializer([heading.node])
			};
		});
	}

	return {
		id: `percollate-page-${uuid()}`,
		url,
		title: sanitizer.sanitize(parsed.title),
		byline: sanitizer.sanitize(parsed.byline),
		dir: sanitizer.sanitize(parsed.dir),
		excerpt: serializer(sanitize_to_dom(parsed.excerpt)),
		content: serializer(
			options.hyphenate === true
				? content_els.map(el => hyphenateDom(el, lang))
				: content_els
		),
		lang,
		textContent,
		toc: nestHeadings(headings || []),
		length: parsed.length,
		siteName: sanitizer.sanitize(parsed.siteName),
		remoteResources
	};
}

function enhancePage(doc) {
	// Note: the order of the enhancements matters!
	[
		ampToHtml,
		fixLazyLoadedImages,
		relativeToAbsoluteURIs,
		imagesAtFullSize,
		singleImgToFigure,
		noUselessHref,
		expandDetailsElements,
		wikipediaSpecific,
		githubSpecific,
		wrapPreBlocks
	].forEach(fn => fn(doc));
}
