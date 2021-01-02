const franc = require('franc-all');
const iso6393 = require('iso-639-3-to-1/6393-6391.json');

function textToIso6393(text) {
	return franc(text);
}

function textToIso6391(text) {
	const franLanguage = textToIso6393(text);
	if (iso6393.hasOwnProperty(franLanguage)) {
		return iso6393[franLanguage];
	}
	return null;
}

function getLanguageAttribute(doc) {
	return doc.documentElement.getAttribute('lang');
}

module.exports = { textToIso6391, getLanguageAttribute };
