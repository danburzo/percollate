let tape = require('tape');
let cliopts = require('../src/cli-opts');

tape('cliopts', t => {
	t.deepEqual(cliopts('pdf - -u https://example.com'.split(' ')), {
		command: 'pdf',
		operands: ['-'],
		opts: {
			url: ['https://example.com']
		}
	});

	t.end();
});
