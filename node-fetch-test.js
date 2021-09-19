import fetch from 'node-fetch';
import convertBody from '@danburzo/fetch-charset-detection';

fetch(
	`http://www.zeno.org/Philosophie/M/Hegel,+Georg+Wilhelm+Friedrich/Enzyklop%C3%A4die+der+philosophischen+Wissenschaften+im+Grundrisse/Erster+Teil.+Die+Wissenschaft+der+Logik./2.+Abteilung%3A+Die+Lehre+vom+Wesen`
).then(async res => {
	const buf = await res.arrayBuffer();
	const text = convertBody(buf, res.headers);
});
