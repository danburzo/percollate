import { pageSize } from './page-size.js';

/*
	Given a JSDOM Document, return the equivalent
	Puppeteer page size configuration 
	for the `@page/size` style declaration.
 */
export default function getCssPageFormat(doc) {
	const pageRule = Array.from(doc.styleSheets)
		.map(sheet => Array.from(sheet.cssRules))
		.flat()
		/* Assume the last `@page {...}` block has precedence */
		.reverse()
		.find(rule => rule.selectorText === '@page');

	return pageRule ? pageSize(pageRule.style.getPropertyValue('size')) : {};
}
