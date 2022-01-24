import { resolveSequence, resolveParallel } from '../src/util/promises.js';
import tape from 'tape';

let arr = [1, 2, 3];
let epsilon = 100; // milliseconds +/- error

tape('resolveSequence', async t => {
	let begin = performance.now();
	let delay = 500;
	let res = await resolveSequence(arr, i => Promise.resolve(i), delay);
	let expected_duration = delay * (arr.length - 1);
	t.deepEqual(res, arr, 'correct result is returned');
	t.ok(
		Math.abs(performance.now() - begin - expected_duration) < epsilon,
		'delay is applied'
	);
	t.end();
});

tape('resolveParallel', async t => {
	let begin = performance.now();
	let res = await resolveParallel(arr, i => Promise.resolve(i));
	let expected_duration = 0;
	t.deepEqual(res, arr, 'correct result is returned');
	t.ok(
		Math.abs(performance.now() - begin - expected_duration) < epsilon,
		"there's no delay"
	);
	t.end();
});
