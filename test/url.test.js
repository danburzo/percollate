import tape from 'tape';
import { getURLOrigin, isURL } from '../src/util/url.js';

tape('getURLOrigin', t => {
	t.equal(getURLOrigin('invalid'), undefined);
	t.equal(getURLOrigin('file:///Users/myuser/'), undefined);
	t.equal(getURLOrigin('https://github.com/user/repo'), 'https://github.com');
	t.end();
});

tape('isURL', t => {
	t.equal(isURL('invalid'), false);
	t.equal(isURL('file:///Users/myuser/'), true);
	t.equal(isURL('https://github.com/user/repo'), true);
	t.end();
});
