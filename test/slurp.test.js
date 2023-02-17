import { Readable } from 'node:stream';
import tape from 'tape';
import slurp from '../src/util/slurp.js';

tape('slurp', async t => {
	const stream = new Readable();
	stream._read = () => {};
	stream.push('Hello');
	stream.push(null);

	t.equal(await slurp(stream).then(r => r.toString()), 'Hello');

	t.end();
});
