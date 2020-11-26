const { JSDOM } = require('jsdom');
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

// This code is from here https://mnater.github.io/Hyphenopoly/Special-use-cases.html#hyphenate-html-strings-using-hyphenopolymodulejs
function hyphenateHtml(html, lang) {
	const hyphenate = getHypenatorByLang(lang);
	if (typeof html === 'string') {
		if (html.trim().startsWith('<')) {
			const fragment = JSDOM.fragment(html);
			const hyphenateNode = async nodeParam => {
				let node = nodeParam;
				for (node = node.firstChild; node; node = node.nextSibling) {
					if (node.nodeType === 3) {
						node.textContent = hyphenate(node.textContent);
					} else {
						hyphenateNode(node);
					}
				}
			};
			hyphenateNode(fragment);
			return fragment.firstChild.outerHTML;
		}
		return hyphenate(html);
	}
	return undefined;
}

module.exports = { hyphenateHtml };
