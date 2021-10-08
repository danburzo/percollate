import fetch from 'node-fetch';

export default function fetchBase64(url, fetchOptions = {}) {
	return fetch(url, fetchOptions)
		.then(r => r.buffer())
		.then(buff => buff.toString('base64'));
}
