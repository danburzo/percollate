const opsh = require('opsh');

/*
	Command-Line Interface definition
	---------------------------------
 */

const available_commands = new Set(['pdf', 'epub', 'html']);
let opts_with_optarg = new Set(['output', 'template', 'style', 'css', 'url']);
let opts_with_arr = new Set(['url']);
let aliases = {
	o: 'output',
	u: 'url',
	h: 'help',
	V: 'version'
};

module.exports = function (args, outputHelp) {
	let opts = {};
	let command;
	let operands = [];
	opsh(args, {
		option(option, value) {
			if (aliases[option]) {
				option = aliases[option];
			}
			if (!command) {
				outputHelp();
				return false;
			}
			let m = option.match(/^no-(.+)$/);

			if (m) {
				opts[m[1]] = value !== undefined ? value : false;
			} else {
				if (opts_with_arr.has(option)) {
					if (!opts[option]) {
						opts[option] = [];
					}
					if (value !== undefined) {
						opts[option].push(value);
					}
				} else {
					opts[option] = value !== undefined ? value : true;
				}
			}
		},
		operand(operand, opt) {
			if (aliases[opt]) {
				opt = aliases[opt];
			}
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
					} else {
						outputHelp();
						return false;
					}
				} else {
					operands.push(operand);
				}
			}
		}
	});
	return { opts, command, operands };
};
