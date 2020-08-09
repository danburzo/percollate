let tape = require('tape');
let { Readability } = require('@mozilla/readability');
let { JSDOM } = require('jsdom');

/*
	A custom (XHTML) serializer is needed for
	EPUB generation. Expect Readability to provide
	this ability.
 */
tape('Supports custom serializer', t => {
	let dom = new JSDOM(`Hello: <img src=''>`);
	let res = new Readability(dom.window.document, {
		serializer: el =>
			new dom.window.XMLSerializer().serializeToString(el.firstChild)
	}).parse();
	t.deepEqual(
		res.content,
		`<div xmlns="http://www.w3.org/1999/xhtml" id="readability-page-1" class="page">Hello: <img src="" /></div>`
	);
	t.end();
});

/*
	Percollate already makes links absolute earlier in the process,
	and we rely on Readability to not change relative srcs on images 
	back to absolute, so that we can build the HTMLs for EPUBs.
 */
tape('Does not make relative links absolute', t => {
	let dom = new JSDOM(`Hello: <img src='./photo.jpg'>`);
	let res = new Readability(dom.window.document).parse();
	t.deepEqual(
		res.content,
		`<div id="readability-page-1" class="page">Hello: <img src="./photo.jpg"></div>`
	);
	t.end();
});
