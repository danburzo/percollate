const opsh = require('opsh');

/*
	Command-Line Interface definition
	---------------------------------
 */

const available_commands = new Set(['pdf', 'epub', 'html']);
let opts_with_optarg = new Set([
	'output',
	'template',
	'style',
	'css',
	'url',
	'title',
	'author'
]);
let opts_with_arr = new Set(['url']);
let aliases = {
	o: 'output',
	u: 'url',
	t: 'title',
	a: 'author',
	h: 'help',
	V: 'version'
};

module.exports = function (args) {
	let opts = {};
	let command;
	let operands = [];
	opsh(args, {
		option(option, value) {
			const opt = aliases[option] ? aliases[option] : option;
			let m = opt.match(/^no-(.+)$/);

			if (m) {
				opts[m[1]] = false;
			} else {
				if (opts_with_arr.has(opt)) {
					if (!opts[opt]) {
						opts[opt] = [];
					}
					if (value !== undefined) {
						opts[opt].push(value);
					}
				} else {
					opts[opt] = value !== undefined ? value : true;
				}
			}
		},
		operand(operand, option) {
			const opt = aliases[option] ? aliases[option] : option;
			if (opts_with_optarg.has(opt)) {
				if (opts_with_arr.has(opt)) {
					opts[opt].push(operand);
				} else {
					opts[opt] = operand;
				}
			} else {
				if (!command) {
					if (available_commands.has(operand)) {
						command = operand;
					}
				} else {
					operands.push(operand);
				}
			}
		}
	});
	return { opts, command, operands };
};
