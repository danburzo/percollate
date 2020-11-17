const franc = require('franc-all');
const iso6393 = require('iso-639-3');

function textToLang(text) {
	const franLanguage = franc(text);
	let lang = 'en';
	iso6393.forEach(language => {
		if (language.iso6393 === franLanguage) {
			lang = language.iso6391;
		}
	});
	return lang;
}

module.exports = { textToLang };
