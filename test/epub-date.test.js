let tape = require('tape');
let epubDate = require('../src/util/epub-date');

tape('epubDate()', t => {
	t.equal(epubDate(new Date(1595872743945)), '2020-07-27T17:59:03Z');
	t.end();
});
