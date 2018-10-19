const shouldFail = (done, promise) =>
	promise
		.then(() => done(new Error('Expected promise to fail')))
		.catch(e => done());

module.exports = { shouldFail };
