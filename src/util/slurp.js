export default async function (stream) {
	const result = [];
	let bufferLength = 0;
	for await (const chunk of stream) {
		result.push(chunk);
		bufferLength += chunk.length;
	}
	return Buffer.concat(result, bufferLength);
}
