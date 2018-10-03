module.exports = function(css_ast, selector) {
	let rule = css_ast.stylesheet.rules.find(
		rule => rule.type === 'rule' && rule.selectors.includes(selector)
	);
	if (!rule) {
		return '';
	}
	return rule.declarations
		.filter(d => d.type === 'declaration')
		.map(d => `${d.property}: ${d.value}`)
		.join(';');
};
