const franc = require('franc-all');
const iso6393 = require('iso-639-3/to-1.json');

function textToLang(text) {
	const franLanguage = franc(text);
	if (iso6393.hasOwnProperty(franLanguage)) {
		return iso6393[franLanguage];
	}
	return 'en';
}

module.exports = { textToLang };
