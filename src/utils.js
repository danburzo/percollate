const flatten = arr =>
	arr.reduce((array, subArray) => array.concat(subArray), []);

module.exports = { flatten };
