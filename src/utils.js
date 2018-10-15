const flatten = arr => arr.reduce((acc, item) => [...acc, ...item], []);

module.exports = { flatten };
