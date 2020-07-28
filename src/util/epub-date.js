module.exports = function epubDate(d) {
	const pad = num => (num < 10 ? '0' + num : num);
	return `${pad(d.getUTCFullYear())}-${pad(d.getUTCMonth() + 1)}-${pad(
		d.getUTCDate()
	)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
		d.getUTCSeconds()
	)}Z`;
};
