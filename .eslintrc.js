module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module'
	},
	rules: {
		'no-const-assign': 1,
		'no-this-before-super': 1,
		'no-undef': 2,
		'no-unreachable': 0,
		'no-unused-vars': [1, { args: 'after-used', ignoreRestSiblings: true }],
		'no-unused-expressions': 0,
		'constructor-super': 1,
		'valid-typeof': 1
	}
};
