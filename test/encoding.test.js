const tape = require('tape-promise').default(require('tape'));

const { __test__ } = require('../index');
const { fetchContent } = __test__;

tape('fetchContent', async t => {
	const text = `Das Absolute ist das <i>Wesen</i>. &#8211; Diese Definition ist insofern dieselbe als die, daß es das <i>Sein</i> ist, insofern Sein gleichfalls die einfache Beziehung auf sich ist; aber sie ist zugleich höher, weil das Wesen das <i>in sich</i> gegangene Sein ist, d. i. seine einfädle Beziehung auf sich ist diese Beziehung, gesetzt als die Negation des Negativen, als Vermittlung seiner in sich mit sich selbst.`;
	const request = fetchContent(
		'http://www.zeno.org/Philosophie/M/Hegel,+Georg+Wilhelm+Friedrich/Enzyklop%C3%A4die+der+philosophischen+Wissenschaften+im+Grundrisse/Erster+Teil.+Die+Wissenschaft+der+Logik./2.+Abteilung%3A+Die+Lehre+vom+Wesen'
	);
	await t.doesNotReject(request, 'should not reject request');

	t.ok((await request).includes(text), 'fetch with correct encoding.');

	t.end();
});
