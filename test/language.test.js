let tape = require('tape');
let { textToIso6391: textToLang } = require('../src/util/language');

tape('textToLang()', t => {
	const text1 = `This is a test sentence!`;
	const text2 = 'مرحبا بالعالم!';
	const text3 = '你好，你叫什么名字？';

	t.equal(textToLang(text1), 'en');
	t.equal(textToLang(text2), 'ar');
	t.equal(textToLang(text3), 'zh');
	t.end();
});
