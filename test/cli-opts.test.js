let tape = require('tape');
let cliopts = require('../src/cli-opts');

const argv = str => str.split(/\s+/);

tape('cliopts', t => {
	t.deepEqual(cliopts(argv('pdf - -u https://example.com')), {
		command: 'pdf',
		operands: ['-'],
		opts: {
			url: ['https://example.com']
		}
	});

	t.end();
});
