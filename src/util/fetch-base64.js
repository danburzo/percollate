import fetch from 'node-fetch';

export default function fetchBase64(url, fetchOptions = {}) {
	return fetch(url, fetchOptions)
		.then(r => r.arrayBuffer())
		.then(buff => Buffer.from(buff).toString('base64'));
}
