export function getUrlOrigin(str) {
	let origin;
	try {
		origin = new URL(str).origin;
	} catch (err) {
		// ignore
	}
	return origin && origin !== 'null' ? origin : undefined;
}
