export function isURL(ref) {
	try {
		new URL(ref);
		return true;
	} catch (err) {
		// no-op
	}
	return false;
}
