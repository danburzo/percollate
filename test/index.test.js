const tape = require('tape-promise').default(require('tape'));
const path = require('path');

const { __test__ } = require('../index');
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

	let template = path.join(__dirname, '../templates/default.html');

	await t.rejects(
		fetchContent('file://' + template),
		'rejects file:// protocol'
	);

	await t.rejects(fetchContent(template), 'rejects local file');

	t.end();
});
