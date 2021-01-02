let tape = require('tape');
const { JSDOM } = require('jsdom');
const querystring = require('querystring');
let { hyphenateDom } = require('../src/hyphenate');

const dom = content => new JSDOM(content).window.document.firstChild;
const serializer = el => el.innerHTML;

tape('hyphenateDom()', t => {
	const doc1 = dom`<head></head><body><div>Automation</div></body>`;
	const doc2 = dom`<div>Automation</div>`;
	const hyphen = querystring.unescape('%C2%AD');
	const test = `<head></head><body><div>Automa${hyphen}tion</div></body>`;

	t.equal(serializer(hyphenateDom(doc1, 'en-us')), test);
	// not supported language fallback to en-us
	t.equal(serializer(hyphenateDom(doc2, 'en')), test);
	t.end();
});
