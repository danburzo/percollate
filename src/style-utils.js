const { flatten } = require('./utils');

const matchSelector = selector => rule =>
	rule.type === 'rule' && rule.selectors.includes(selector);

const extractCss = function(cssAst, selector) {
	const ruleDeclarations = cssAst.stylesheet.rules.filter(
		matchSelector(selector)
	);

	return flatten(ruleDeclarations.map(rule => rule.declarations))
		.filter(d => d.type === 'declaration')
		.map(d => `${d.property}: ${d.value}`)
		.join(';');
};

module.exports = { extractCss };
