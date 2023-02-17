import { TextDecoder } from 'node:util';
import htmlEncodingSniffer from 'html-encoding-sniffer';
import MimeType from 'whatwg-mimetype';

import tape from 'tape';
import { __test__ } from '../index.js';
const { fetchContent } = __test__;

tape('fetchContent', async t => {
	const text = `Das Absolute ist das <i>Wesen</i>. &#8211; Diese Definition ist insofern dieselbe als die, daß es das <i>Sein</i> ist, insofern Sein gleichfalls die einfache Beziehung auf sich ist; aber sie ist zugleich höher, weil das Wesen das <i>in sich</i> gegangene Sein ist, d. i. seine einfädle Beziehung auf sich ist diese Beziehung, gesetzt als die Negation des Negativen, als Vermittlung seiner in sich mit sich selbst.`;
	const { buffer, contentType } = await fetchContent(
		'http://www.zeno.org/Philosophie/M/Hegel,+Georg+Wilhelm+Friedrich/Enzyklop%C3%A4die+der+philosophischen+Wissenschaften+im+Grundrisse/Erster+Teil.+Die+Wissenschaft+der+Logik./2.+Abteilung%3A+Die+Lehre+vom+Wesen'
	);
	await t.ok(buffer, 'should not reject request');

	const encoding = contentType
		? new MimeType(contentType).parameters.get('charset')
		: undefined;

	const str = new TextDecoder(
		htmlEncodingSniffer(buffer, {
			transportLayerEncodingLabel: encoding
		})
	).decode(buffer);

	t.ok(str.includes(text), 'Uses correct encoding.');

	t.end();
});
