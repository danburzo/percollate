import { isURL } from './url.js';

function isAtomFeed(doc) {
	return (
		doc.documentElement.localName === 'feed' &&
		doc.documentElement.namespaceURI === 'http://www.w3.org/2005/Atom'
	);
}

function isRssFeed(doc) {
	return doc.documentElement.localName === 'rss';
}

function processAtomFeed(doc) {
	const feedLink = doc
		.querySelector('feed > link:not([rel]), feed > link[rel=alternate]')
		?.getAttribute('href');
	const feedAuthor = doc.querySelector('feed > author name')?.textContent;
	const entries = Array.from(doc.querySelectorAll('feed > entry')).map(
		entry => {
			const ret = {
				title: entry.querySelector('title')?.textContent ?? '',
				published: entry.querySelector('published')?.textContent,
				updated: entry.querySelector('updated')?.textContent,
				byline:
					entry.querySelector('author name')?.textContent ??
					feedAuthor,
				url: entry
					.querySelector('link:not([rel]), link[rel=alternate]')
					?.getAttribute('href'),
				content: entry.querySelector('content')?.textContent ?? ''
			};
			if (isURL(ret.link)) {
				// Resolve relative entry link, TODO: also use xml:base
				ret.link = new URL(ret.link, feedLink).href;
			}
			if (ret.updated && !ret.published) {
				ret.published = ret.updated;
			}
			return ret;
		}
	);
	return entries;
}

function processRssFeed(doc) {
	const feedLink = doc.querySelector(
		'channel > link:not([rel]), channel > link[rel=alternate]'
	)?.textContent;
	const feedAuthor = doc.querySelector('channel > author')?.textContent;
	const entries = Array.from(doc.querySelectorAll('channel > item')).map(
		entry => {
			const ret = {
				title: entry.querySelector('title')?.textContent ?? '',
				published: entry.querySelector('pubDate')?.textContent,
				updated: entry.querySelector('atom\\:updated')?.textContent,
				byline:
					entry.querySelector('author')?.textContent ?? feedAuthor,
				url:
					entry.querySelector('link:not([rel]), link[rel=alternate]')
						?.textContent ?? '',
				content: entry.querySelector('description')?.textContent ?? ''
			};
			if (isURL(ret.link)) {
				// Resolve relative entry link, TODO: also use xml:base
				ret.link = new URL(ret.link, feedLink).href;
			}
			if (ret.updated && !ret.published) {
				ret.published = ret.updated;
			}
			return ret;
		}
	);
	return entries;
}

export function isFeed(doc) {
	return isAtomFeed(doc) || isRssFeed(doc);
}

export function processFeed(doc) {
	if (isAtomFeed(doc)) {
		return processAtomFeed(doc);
	}
	if (isRssFeed(doc)) {
		return processRssFeed(doc);
	}
	return null;
}
