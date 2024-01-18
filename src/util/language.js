import { francAll } from 'franc-all';
import convert3To1 from 'iso-639-3-to-1';

function textToIso6393(text) {
	const res = francAll(text);
	return Array.isArray(res) && Array.isArray(res[0]) ? res[0][0] : null;
}

function textToIso6391(text) {
	const francLang = textToIso6393(text);
	if (!francLang) {
		return null;
	}
	return convert3To1(francLang) || null;
}

function getLanguageAttribute(doc) {
	return doc.documentElement?.getAttribute('lang');
}

export { textToIso6391, getLanguageAttribute };
