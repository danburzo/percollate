import fs from 'node:fs';
import stream from 'node:stream';
import path from 'node:path';
import { randomUUID as uuid } from 'node:crypto';

import pup from 'puppeteer';
import archiver from 'archiver';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import nunjucks from 'nunjucks';
import css from 'css';
import { Readability } from '@mozilla/readability';
import createDOMPurify from 'dompurify';

import slurp from './src/util/slurp.js';
import mimetype from './src/util/mimetype.js';
import epubDate from './src/util/epub-date.js';
import humanDate from './src/util/human-date.js';
import outputPath from './src/util/output-path.js';
import getCssPageFormat from './src/util/get-css-page-format.js';
import { resolveSequence, resolveParallel } from './src/util/promises.js';
import addExif from './src/exif.js';
import { hyphenateDom } from './src/hyphenate.js';
import { textToIso6391, getLanguageAttribute } from './src/util/language.js';

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
} from './src/enhancements.js';
import mapRemoteResources from './src/remote-resources.js';
import inlineImages from './src/inline-images.js';
import get_style_attribute_value from './src/get-style-attribute-value.js';
import { fileURLToPath } from 'url';

const out = process.stdout;

const { readFile, writeFile } = fs.promises;

const pkg = JSON.parse(
	fs.readFileSync(new URL('./package.json', import.meta.url))
);

let UA = `percollate/${pkg.version}`;

const JUSTIFY_CSS = `
	.article__content p {
		text-align: justify;
	}
`;

const enhancePage = function (dom) {
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
	].forEach(enhancement => {
		enhancement(dom.window.document);
	});
};

/*
	Some setup
	----------
 */
let configured = false;
function configure() {
	if (!configured) {
		nunjucks.configure({ autoescape: false, noCache: true });
		configured = true;
	}
}

function launch(options, size) {
	/*
		Produce tagged PDFs, better for accessibility;
		Hopefully will also produce an Outline (ToC) eventually.
		See: https://github.com/danburzo/percollate/issues/47
	 */
	let args = ['--export-tagged-pdf'];

	/*
		Allow running with no sandbox
		See: https://github.com/danburzo/percollate/issues/26
	 */
	if (options.sandbox === false) {
		args = args.concat(['--no-sandbox', '--disable-setuid-sandbox']);
	}

	return pup.launch({
		headless: true,
		product: options.browser || 'chrome',
		args,
		defaultViewport: {
			// Emulate retina display (@2x)...
			deviceScaleFactor: 2,
			// ...but then we need to provide the other
			// viewport parameters as well
			width: 1920,
			height: 1080,
			...size
		}
	});
}

/*
	Fetch a web page and clean the HTML
	-----------------------------------
 */

function isURL(ref) {
	try {
		new URL(ref);
		return true;
	} catch (err) {
		// no-op
	}
	return false;
}

const accepted_content_types = new Set([
	'text/html',
	'application/xhtml+xml',
	'application/xml'
]);

async function fetchContent(ref, fetchOptions = {}) {
	if (ref instanceof stream.Readable) {
		return slurp(ref);
	}

	let url;
	try {
		url = new URL(ref);
	} catch (err) {
		// no-op
	}

	if (!url) {
		return readFile(ref, 'utf8');
	}

	if (url && url.protocol === 'file:') {
		url = decodeURI(url.href.replace(/^file:\/\//, ''));
		return readFile(url, 'utf8');
	}

	/*
		Must ensure that the URL is properly encoded.
		See: https://github.com/danburzo/percollate/pull/83
	 */
	return fetch(url.href, {
		...fetchOptions,
		headers: {
			...fetchOptions.headers,
			'user-agent': UA
		}
	}).then(response => {
		let ct = (response.headers.get('Content-Type') || '').trim();
		if (ct.indexOf(';') > -1) {
			ct = ct.split(';')[0].trim();
		}
		if (!accepted_content_types.has(ct)) {
			throw new Error(
				`URL ${url.href} has unsupported content type: ${ct}`
			);
		}
		return response.arrayBuffer();
	});
}

async function cleanup(url, options) {
	if (!url) {
		return null;
	}
	try {
		out.write(`Fetching: ${url}`);

		const content = await fetchContent(
			url === '-' ? process.stdin : url,
			options.fetch || {}
		);

		out.write(' ✓\n');

		const final_url =
			options.preferred_url !== undefined
				? options.preferred_url
				: url === '-'
				? undefined
				: isURL(url)
				? url
				: 'file://' + path.resolve(url);

		const dom = new JSDOM(content, { url: final_url });

		// Force relative URL resolution
		dom.window.document.body.setAttribute(null, null);

		const sanitizer = createDOMPurify(dom.window);

		const amp = dom.window.document.querySelector('link[rel~=amphtml]');
		if (amp && options.amp) {
			out.write('\nFound AMP version (use `--no-amp` to ignore)\n');
			return cleanup(amp.href, options, amp.href);
		}

		out.write(`Enhancing web page: ${url}`);

		/* 
			Run enhancements
			----------------
		*/
		enhancePage(dom);

		// Run through readability and return
		const R = new Readability(dom.window.document, {
			classesToPreserve: [
				'no-href',

				/*
					Placed on some <a> elements
					as in-page anchors
				 */
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

		const parsed = R.parse() || {};

		let remoteResources;
		if (options.mapRemoteResources) {
			remoteResources = mapRemoteResources(parsed.content);
		}

		// Hyphenate the text
		const textContent = sanitizer.sanitize(parsed.textContent);
		const lang =
			getLanguageAttribute(dom.window.document) ||
			textToIso6391(textContent);

		out.write(' ✓\n');

		if (options.inline) {
			await inlineImages(
				parsed.content,
				{
					headers: {
						'user-agent': UA
					},
					timeout: 10 * 1000
				},
				options.debug ? out : undefined
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
			Array.from(
				sanitizer.sanitize(dirty, { RETURN_DOM: true }).children
			);

		const content_els = sanitize_to_dom(parsed.content);

		return {
			id: `percollate-page-${uuid()}`,
			url: final_url,
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
			length: parsed.length,
			siteName: sanitizer.sanitize(parsed.siteName),
			remoteResources,
			originalContent: content
		};
	} catch (error) {
		console.error(`${url}:`, error.message);
		throw error;
	}
}

/*
	Bundle the HTML files into a PDF
	--------------------------------
 */
async function bundlePdf(items, options) {
	const DEFAULT_STYLESHEET = new URL(
		'templates/default.css',
		import.meta.url
	);
	const DEFAULT_TEMPLATE = new URL('templates/default.html', import.meta.url);

	const style =
		(await readFile(options.style || DEFAULT_STYLESHEET, 'utf8')) +
		(options.hyphenate === true ? JUSTIFY_CSS : '') +
		(options.css || '');

	const title =
		options.title || (items.length === 1 ? items[0].title : 'Untitled');
	const author =
		options.author || (items.length === 1 ? items[0].byline : undefined);

	const html = nunjucks.renderString(
		await readFile(options.template || DEFAULT_TEMPLATE, 'utf8'),
		{
			filetype: 'pdf',
			title,
			author,
			date: humanDate(new Date()),
			items,
			style,
			options: {
				use_toc:
					options.toc || (items.length > 1 && options.toc !== false),
				use_cover:
					options.cover ||
					(options.cover !== false &&
						(options.title || items.length > 1))
			}
		}
	);

	const doc = new JSDOM(html).window.document;
	const headerTemplate = doc.querySelector('.header-template');
	const footerTemplate = doc.querySelector('.footer-template');
	const header = new JSDOM(
		headerTemplate ? headerTemplate.innerHTML : '<span></span>'
	).window.document;
	const footer = new JSDOM(
		footerTemplate ? footerTemplate.innerHTML : '<span></span>'
	).window.document;

	const css_ast = css.parse(style);

	const header_style = get_style_attribute_value(css_ast, '.header-template');
	const header_div = header.querySelector('body :first-child');

	if (header_div && header_style) {
		header_div.setAttribute(
			'style',
			`
				${header_style};
				${header_div.getAttribute('style') || ''}
			`
		);
	}

	const footer_style = get_style_attribute_value(css_ast, '.footer-template');
	const footer_div = footer.querySelector('body :first-child');

	if (footer_div && footer_style) {
		footer_div.setAttribute(
			'style',
			`
				${footer_style};
				${footer_div.getAttribute('style') || ''}
			`
		);
	}

	if (options.debug) {
		out.write('Generating temporary HTML file... ');
		const temp_file = path.resolve(process.cwd(), `${uuid()}.html`);
		await writeFile(temp_file, html);
		out.write('✓\n');
		out.write(`Temporary HTML file: file://${temp_file}\n`);
	}

	const browser = await launch(options);
	const page = await browser.newPage();

	/*
		Increase the navigation timeout to 2 minutes
		See: https://github.com/danburzo/percollate/issues/80
	 */
	page.setDefaultNavigationTimeout(120 * 1000);

	if (options.debug) {
		page.on('response', response => {
			out.write(`Fetched: ${response.url()}\n`);
		});
	}

	await page.setContent(html, { waitUntil: 'load' });

	const output_path = outputPath(items, options, '.pdf', options.slugCache);

	const pdfOptions = {
		preferCSSPageSize: true,
		displayHeaderFooter: options.browser === 'chrome',
		headerTemplate: header.body.innerHTML,
		footerTemplate: footer.body.innerHTML,
		printBackground: true
	};

	/*
		Currently, Firefox does not produce PDFs 
		with the page format specified by the author 
		with the `@page/size` CSS declaration.

		We need to extract that value ourselves and produce
		the appropriate Puppeteer config.

		Once these tasks get done in Firefox,
		the EXPLICIT_PAGE_SIZE_FROM_CSS code path can be removed:

		https://bugzilla.mozilla.org/show_bug.cgi?id=1793220
		https://bugzilla.mozilla.org/show_bug.cgi?id=1815565
	 */
	const EXPLICIT_PAGE_SIZE_FROM_CSS = options.browser === 'firefox';

	let buffer = await page.pdf(
		EXPLICIT_PAGE_SIZE_FROM_CSS
			? {
					...pdfOptions,
					...getCssPageFormat(doc)
			  }
			: pdfOptions
	);

	await browser.close();

	let pdf = await addExif(buffer, {
		Title: title,
		Author: author
	});

	await writeFile(output_path, pdf);

	out.write(`Saved PDF: ${output_path}\n`);
}

/*
	Bundle the HTML files into a EPUB
	---------------------------------
 */
async function bundleEpub(items, options) {
	const DEFAULT_STYLESHEET = new URL(
		'templates/default.css',
		import.meta.url
	);
	const style =
		(await readFile(options.style || DEFAULT_STYLESHEET, 'utf8')) +
		(options.hyphenate === true ? JUSTIFY_CSS : '') +
		(options.css || '');

	out.write('Saving EPUB...\n');

	const output_path = outputPath(items, options, '.epub', options.slugCache);

	const title =
		options.title || (items.length === 1 ? items[0].title : 'Untitled');
	const author =
		options.author || (items.length === 1 ? items[0].byline : undefined);

	await epubgen(
		{
			filetype: 'epub',
			title,
			author,
			date: epubDate(new Date()),
			cover:
				options.cover ||
				(options.cover !== false &&
					(options.title || items.length > 1)),
			uuid: uuid(),
			items,
			style
		},
		output_path,
		options
	);

	out.write(`Saved EPUB: ${output_path}\n`);
}

/*
	Bundle the HTML files into a HTML
	--------------------------------
 */
async function bundleHtml(items, options) {
	const DEFAULT_STYLESHEET = new URL(
		'templates/default.css',
		import.meta.url
	);
	const DEFAULT_TEMPLATE = new URL('templates/default.html', import.meta.url);

	const style =
		(await readFile(options.style || DEFAULT_STYLESHEET, 'utf8')) +
		(options.hyphenate === true ? JUSTIFY_CSS : '') +
		(options.css || '');

	const html = nunjucks.renderString(
		await readFile(options.template || DEFAULT_TEMPLATE, 'utf8'),
		{
			filetype: 'html',
			title:
				options.title ||
				(items.length === 1 ? items[0].title : 'Untitled'),
			date: humanDate(new Date()),
			items,
			style,
			options: {
				use_toc:
					options.toc || (items.length > 1 && options.toc !== false),
				use_cover:
					options.cover ||
					(options.cover !== false &&
						(options.title || items.length > 1))
			}
		}
	);

	out.write('Saving HTML...\n');

	const output_path = outputPath(items, options, '.html', options.slugCache);

	await writeFile(output_path, html);

	out.write(`Saved HTML: ${output_path}\n`);
}

async function generate(fn, urls, options = {}) {
	if (!configured) {
		configure();
	}
	if (!urls.length) {
		return null;
	}
	let w = options.wait * 1000;
	if (options.debug && w) {
		if (Number.isFinite(w) && w >= 0) {
			out.write(
				`Processing URLs sequentially, waiting ${options.wait} seconds in-between.\n`
			);
		} else {
			out.write(
				`Invalid --wait: expecting positive number, got ${options.wait}. Processing URLs in parallel.\n`
			);
		}
	}
	let resolve =
		Number.isFinite(w) && w >= 0 ? resolveSequence : resolveParallel;
	let items = (
		await resolve(
			urls,
			(url, i) => {
				return cleanup(url, {
					...options,
					preferred_url: options.url ? options.url[i] : undefined
				}).catch(err => {
					console.error(err);
					console.log('Ignoring item');
					return null;
				});
			},
			w
		)
	).filter(it => it);

	if (options.individual) {
		await Promise.all(items.map(item => fn([item], options)));
	} else {
		await fn(items, options);
	}
	return {
		items,
		options
	};
}

/*
	Generate PDF
 */
async function pdf(urls, options) {
	return await generate(bundlePdf, urls, {
		...options,
		// Hyphenate by default
		hyphenate: options.hyphenate !== undefined ? options.hyphenate : true,
		slugCache: {}
	});
}

/*
	Generate EPUB
 */
async function epub(urls, options) {
	return await generate(bundleEpub, urls, {
		...options,
		xhtml: true,
		mapRemoteResources: !options.inline,
		hyphenate: options.hyphenate !== undefined ? options.hyphenate : false,
		slugCache: {}
	});
}

/*
	Generate HTML
 */
async function html(urls, options) {
	return await generate(bundleHtml, urls, {
		...options,
		hyphenate: options.hyphenate !== undefined ? options.hyphenate : false,
		slugCache: {}
	});
}

/*
	Produce an EPUB file
	--------------------

	Reference: 

		https://www.ibm.com/developerworks/xml/tutorials/x-epubtut/index.html
 */

async function epubgen(data, output_path, options) {
	const wrapAsync = inner => {
		return new Promise((resolve, reject) => {
			inner(resolve, reject).catch(reject);
		});
	};

	return wrapAsync(async (resolve, reject) => {
		const template_base = fileURLToPath(
			new URL('templates/epub/', import.meta.url)
		);

		const output = fs.createWriteStream(output_path);
		const archive = archiver('zip', {
			store: true
		});

		output
			.on('finish', () => {
				out.write(`${archive.pointer()} total bytes, archive closed\n`);
				resolve();
			})
			.on('error', reject);

		archive.on('warning', reject).on('error', reject).pipe(output);

		// mimetype file must be first
		archive.append('application/epub+zip', { name: 'mimetype' });

		// static files from META-INF
		archive.directory(path.join(template_base, 'META-INF'), 'META-INF');

		const contentTemplate = await readFile(
			path.join(template_base, 'OEBPS/content.xhtml'),
			'utf8'
		);
		const navTemplate = await readFile(
			path.join(template_base, 'OEBPS/nav.xhtml'),
			'utf8'
		);
		const tocTemplate = await readFile(
			path.join(template_base, 'OEBPS/toc.ncx'),
			'utf8'
		);
		const opfTemplate = await readFile(
			path.join(template_base, 'OEBPS/content.opf'),
			'utf8'
		);

		archive.append(data.style || '', { name: 'OEBPS/style.css' });

		let remoteResources = [];
		data.items.forEach(item => {
			remoteResources = remoteResources.concat(
				item.remoteResources || []
			);
			let item_content = nunjucks.renderString(contentTemplate, {
				...data,
				item
			});
			archive.append(item_content, { name: `OEBPS/${item.id}.xhtml` });
		});

		for (let i = 0; i < remoteResources.length; i++) {
			let entry = remoteResources[i];
			try {
				if (options.debug) {
					out.write(`Fetching: ${entry[0]}\n`);
				}
				let stream = (
					await fetch(entry[0], {
						headers: {
							'user-agent': UA
						},
						timeout: 10 * 1000
					})
				).body;
				archive.append(stream, { name: `OEBPS/${entry[1]}` });
			} catch (err) {
				console.log(err);
			}
		}

		const assets = [
			{
				id: 'style',
				href: 'style.css',
				mimetype: 'text/css'
			}
		];

		if (data.cover) {
			const COVER_TEMPLATE = new URL(
				'templates/cover.html',
				import.meta.url
			);
			const cover_html = nunjucks.renderString(
				await readFile(COVER_TEMPLATE, 'utf8'),
				data
			);

			const browser = await launch(options, {
				width: 400,
				height: 565
			});
			const page = await browser.newPage();

			await page.setUserAgent(UA);
			await page.setContent(cover_html, { waitUntil: 'load' });

			let buff = await page.screenshot({
				type: 'png',
				fullPage: true
			});

			archive.append(buff, { name: 'OEBPS/cover.png' });

			await browser.close();
		}

		const nav = nunjucks.renderString(navTemplate, data);
		const opf = nunjucks.renderString(opfTemplate, {
			...data,
			assets,
			cover: data.cover
				? {
						id: 'cover',
						href: 'cover.png',
						mimetype: 'image/png'
				  }
				: undefined,
			remoteResources: remoteResources.map(entry => ({
				id: entry[1].replace(/[^a-z0-9]/gi, ''),
				href: entry[1],
				mimetype: mimetype(entry[1])
			}))
		});

		const toc = nunjucks.renderString(tocTemplate, data);

		archive.append(nav, { name: 'OEBPS/nav.xhtml' });
		archive.append(opf, { name: 'OEBPS/content.opf' });
		archive.append(toc, { name: 'OEBPS/toc.ncx' });

		archive.finalize();
	});
}

export { configure, pdf, epub, html };

export const __test__ = {
	fetchContent,
	isURL
};
