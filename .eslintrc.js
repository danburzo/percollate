module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'script'
	},

	rules: {
		'array-callback-return': 2,
		'consistent-return': 2,
		'constructor-super': 1,
		'no-cond-assign': 2,
		'no-console': [1, { allow: ['log', 'error'] }],
		'no-const-assign': 1,
		'no-constant-condition': 2,
		'no-dupe-keys': 2,
		'no-else-return': 2,
		'no-extra-bind': 2,
		'no-magic-numbers': 0,
		'no-param-reassign': 2,
		'no-redeclare': 2,
		'no-return-assign': 2,
		'no-sequences': 2,
		'no-this-before-super': 1,
		'no-undef': 2,
		'no-unreachable': 2,
		'no-unused-expressions': 1,
		'no-unused-vars': [1, { args: 'after-used', ignoreRestSiblings: true }],
		'no-use-before-define': [2, { functions: false }],
		'no-useless-call': 2,
		'use-isnan': 2,
		'valid-typeof': 2,
		eqeqeq: 2,
		yoda: 1
	}
};
