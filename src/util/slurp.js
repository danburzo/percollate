module.exports = stream =>
	new Promise((fulfill, reject) => {
		let content = '';
		stream
			.setEncoding('utf8')
			.on('readable', () => {
				let chunk;
				while ((chunk = stream.read()) !== null) {
					content += chunk;
				}
			})
			.on('end', () => {
				fulfill(content);
			})
			.on('error', error => {
				reject(error);
			});
	});
