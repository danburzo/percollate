import tape from 'tape';
import outputPath from '../src/util/output-path.js';

tape('outputPath', t => {
	t.equal(
		outputPath(
			[
				{
					title: 'Hello'
				}
			],
			{
				individual: true,
				output: 'test.pdf'
			},
			'.pdf'
		),
		'test-Hello.pdf'
	);
	t.equal(
		outputPath(
			[
				{
					title: 'Hello'
				}
			],
			{
				output: 'test.pdf'
			},
			'.pdf'
		),
		'test.pdf'
	);
	t.end();
});
