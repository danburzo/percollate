/*
	Promise aggregation functions
	-----------------------------
 */

/*
	Run the asynchronous `fn` function sequentially
	on each item in the `items` array, with an optional
	`delay` in milliseconds between items.
 */
export function resolveSequence(arr, fn, delay = 0) {
	return arr.reduce((chain, item, i) => {
		return chain
			.then(async result => {
				if (delay && i > 0) {
					await new Promise(r => setTimeout(r, delay));
				}
				return result;
			})
			.then(result => {
				return fn(item, i, arr).then(content => [...result, content]);
			});
	}, Promise.resolve([]));
}

/*
	Run the asynchronous `fn` function in parallel
	on each item in the `items` array.
 */
export function resolveParallel(items, fn) {
	return Promise.all(items.map(fn));
}
