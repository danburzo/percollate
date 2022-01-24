export function timeout(ms = 0) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function resolveSequence(delay = 0) {
	return function (arr, fn) {
		return arr.reduce((chain, item, i) => {
			return chain
				.then(async result => {
					if (delay && i > 0) {
						await timeout(delay * 1000);
					}
					return result;
				})
				.then(result => {
					return fn(item, i, arr).then(content => [
						...result,
						content
					]);
				});
		}, Promise.resolve([]));
	};
}

export function resolveParallel(arr, fn) {
	return Promise.all(arr.map(fn));
}
