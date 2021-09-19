import tape from 'tape';

import { __test__ } from '../index.js';
const { fetchContent } = __test__;

tape('fetchContent', async t => {
	await t.rejects(
		fetchContent('example.com'),
		'should reject for invalid urls'
	);
	await t.rejects(
		fetchContent('http://localhost:8080/error'),
		'should reject if the result is a rejected promise'
	);

	let template = new URL('../templates/default.html', import.meta.url);
	let missing = new URL(
		'../templates/default--missing.html',
		import.meta.url
	);

	await t.doesNotReject(
		fetchContent('file://' + template),
		'accepts file:// protocol'
	);

	await t.doesNotReject(
		fetchContent(template),
		'accepts existing local file'
	);

	await t.rejects(fetchContent(missing), 'rejects missing local file');

	await t.doesNotReject(
		fetchContent('./templates/default.html'),
		'accepts path to local file relative to process.cwd()'
	);

	t.end();
});
