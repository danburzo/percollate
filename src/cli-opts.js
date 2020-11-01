/*
	Command-Line Interface definition
	---------------------------------
 */

function opsh(arr, fn) {
	const noop = () => {};
	const fn_opt = fn.option || noop;
	const fn_operand = fn.operand || noop;
	const fn_delim = fn.delimiter || noop;

	let args = arr.slice();
	let curr,
		m,
		has_delim = false,
		last_opt = undefined;
	while ((curr = args.shift()) !== undefined) {
		if (has_delim) {
			if (fn_operand(curr) === false) {
				return;
			}
			continue;
		}

		// -xyz
		if ((m = curr.match(/^-([a-zA-Z0-9]+)$/))) {
			last_opt = m[1][m[1].length - 1];
			if (m[1].split('').some(f => fn_opt(f) === false)) {
				return;
			}
			continue;
		}

		// --x=y
		if ((m = curr.match(/^--([a-zA-Z0-9\-.]+)(?:=([^]*))?$/))) {
			last_opt = m[2] === undefined ? m[1] : undefined;
			if (fn_opt(m[1], m[2]) === false) {
				return;
			}
			continue;
		}

		if (curr === '--') {
			if (fn_delim(curr, last_opt) === false) {
				return;
			}
			has_delim = true;
			last_opt = undefined;
			continue;
		}

		if (last_opt) {
			if (fn_operand(curr, last_opt) === false) {
				return;
			}
			last_opt = undefined;
			continue;
		}

		if (fn_operand(curr) === false) {
			return;
		}
	}
	return;
}

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
