import tape from 'tape';
import { getUrlOrigin } from '../src/util/url-origin.js';

tape('getUrlOrigin', t => {
	t.equal(getUrlOrigin('invalid'), undefined);
	t.equal(getUrlOrigin('file:///Users/myuser/'), undefined);
	t.equal(getUrlOrigin('https://github.com/user/repo'), 'https://github.com');
	t.end();
});
