module.exports = function(css_ast, selector) {
	let rules = css_ast.stylesheet.rules.filter(
		rule => rule.type === 'rule' && rule.selectors.includes(selector)
	);
	if (!rules.length) {
		return '';
	}
	return rules
		.map(rule =>
			rule.declarations
				.filter(d => d.type === 'declaration')
				.map(d => `${d.property}: ${d.value}`)
				.join(';')
		)
		.join(';');
};
