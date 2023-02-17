export default async function (stream) {
	const array = [];
	let bufferLength = 0;
	for await (const chunk of stream) {
		array.push(chunk);
		bufferLength += chunk.length;
	}
	return Buffer.concat(result, bufferLength);
}
