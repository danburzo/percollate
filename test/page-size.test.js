import tape from 'tape';
import { pageSize, isLength } from '../src/util/page-size.js';

const valid_lengths = ['0', '1em', '.5cm', '1e-1mm', ' 4cm\t'];

const invalid_lengths = ['em', '4 cm', '1 2px'];

tape('isLength', t => {
	valid_lengths.map(v => t.ok(isLength(v), v));
	invalid_lengths.map(v => t.notOk(isLength(v), v));
	t.end();
});

tape('pageSize', t => {
	t.deepEqual(
		pageSize('a5'),
		{
			format: 'a5'
		},
		'<page-size>, common'
	);

	t.deepEqual(
		pageSize('b4'),
		{
			width: '25cm',
			height: '35.3cm'
		},
		'<page-size>, css-only'
	);

	t.deepEqual(pageSize('tabloid'), {}, '<page-size>, puppeteer-only');

	t.deepEqual(
		pageSize('10cm'),
		{
			width: '10cm',
			height: '10cm'
		},
		'<length>'
	);

	t.deepEqual(
		pageSize('10in 40cm'),
		{
			width: '10in',
			height: '40cm'
		},
		'<length>{2}'
	);

	t.deepEqual(
		pageSize('A4 landscape'),
		{
			format: 'a4',
			landscape: true
		},
		'<page-size> <orientation>'
	);

	t.end();
});
