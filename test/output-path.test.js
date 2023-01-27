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

tape('overlapping names', t => {
	const cache = {};
	const t1 = outputPath([{ title: 'Overlapping Title' }], {}, '.pdf', cache);
	const t2 = outputPath([{ title: 'Overlapping Title' }], {}, '.pdf', cache);
	t.equal(t1, 'Overlapping-Title.pdf');
	t.equal(t2, 'Overlapping-Title-1.pdf');
	t.end();
});
