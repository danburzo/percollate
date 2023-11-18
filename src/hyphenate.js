import { readFileSync } from 'node:fs';
import Hyphenator from 'hyphenopoly';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const DEFAULT_LANG = 'en-us';

function getHypenatorByLang(lang) {
	const language = Hyphenator.supportedLanguages.includes(lang)
		? lang
		: DEFAULT_LANG;
	return Hyphenator.config({
		sync: true,
		loaderSync: file => {
			return readFileSync(
				require.resolve(`hyphenopoly/patterns/${file}`)
			);
		},
		require: [language],
		defaultLanguage: DEFAULT_LANG,
		minWordLength: 6,
		leftmin: 3,
		rightmin: 3
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

export { hyphenateDom };
