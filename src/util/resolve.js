module.exports = function (path) {
	return require.resolve(path, {
		paths: [process.cwd(), __dirname]
	});
};
