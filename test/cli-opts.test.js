import tape from 'tape';
import cliopts from '../src/cli-opts.js';

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
