module.exports = function humanDate(d) {
	const pad = num => (num < 10 ? '0' + num : num);
	return `${pad(d.getUTCFullYear())}-${pad(d.getUTCMonth() + 1)}-${pad(
		d.getUTCDate()
	)}`;
};
