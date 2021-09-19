import tape from 'tape';
import { JSDOM } from 'jsdom';
import {
	textToIso6391 as textToLang,
	getLanguageAttribute
} from '../src/util/language.js';

const dom = content => new JSDOM(content);

tape('textToLang()', t => {
	const text1 = `This is a test sentence!`;
	const text2 = 'مرحبا بالعالم!';
	const text3 = '你好，你叫什么名字？';
	const doc1 = dom`<html lang="en"></html>`;
	const doc2 = dom`<html></html>`;

	t.equal(textToLang(text1), 'en');
	t.equal(textToLang(text2), 'ar');
	t.equal(textToLang(text3), 'zh');
	t.equal(getLanguageAttribute(doc1.window.document), 'en');
	t.equal(getLanguageAttribute(doc2.window.document), null);
	t.end();
});
