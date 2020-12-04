const Hyphenator = require('hyphenopoly');

function getHypenatorByLang(lang) {
	const language = Hyphenator.supportedLanguages.includes(lang)
		? lang
		: 'en-us';
	return Hyphenator.config({
		sync: true,
		require: [language],
		defaultLanguage: 'en-us',
		minWordLength: 6,
		leftmin: 4,
		rightmin: 4
	});
}

function hyphenateDom(el, lang) {
	const hyphenate = getHypenatorByLang(lang);
	const it = el.ownerDocument.createNodeIterator(el, 4);
	let node = it.nextNode();
	while (node) {
		node.textContent = hyphenate(node.textContent);
		node = it.nextNode();
	}
	return el;
}

module.exports = { hyphenateDom };
