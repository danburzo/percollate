import tape from 'tape';

import { __test__ } from '../index.js';
const { fetchContent } = __test__;

tape('fetchContent', async t => {
	try {
		await fetchContent('example.com');
		t.fail();
	} catch (err) {
		t.ok(true, 'should reject for invalid urls');
	}

	try {
		await fetchContent('http://localhost:8080/error');
		t.fail();
	} catch (err) {
		t.ok(true, 'should reject if the result is a rejected promise');
	}

	let template = new URL('../templates/default.html', import.meta.url);
	let missing = new URL(
		'../templates/default--missing.html',
		import.meta.url
	);

	await t.ok(
		await fetchContent('file://' + template),
		'accepts file:// protocol'
	);

	await t.ok(await fetchContent(template), 'accepts existing local file');

	try {
		await fetchContent(missing);
		t.fail();
	} catch (err) {
		t.ok(true, 'rejects missing local file');
	}

	await t.ok(
		await fetchContent('./templates/default.html'),
		'accepts path to local file relative to process.cwd()'
	);

	t.end();
});
