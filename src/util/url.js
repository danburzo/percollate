// Polyfill for URL.canParse(), which was added in later Node.js versions
export function isURL(ref) {
	try {
		new URL(ref);
		return true;
	} catch (err) {
		// no-op
	}
	return false;
}

export function getURLOrigin(str) {
	let origin;
	try {
		origin = new URL(str).origin;
	} catch (err) {
		// ignore
	}
	return origin && origin !== 'null' ? origin : undefined;
}
