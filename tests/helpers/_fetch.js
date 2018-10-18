const _fetch = url => {
	const _r = (body = '') => Promise.resolve({ body });
	const _err = (msg = 'Error') => Promise.reject(msg);

	switch (url.replace(/^https?:\/\//gi, '')) {
		case 'example.com':
			return _r(`
            <title>Example</title>
            <div>This is example!</div>
        `);
		case 'example.com/error':
			return _err();
		default:
			return _r();
	}
};

module.exports = _fetch;
