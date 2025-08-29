export default function wrapHTMLFragment(item) {
	return `<!doctype html>
<html>
	<head>
		<title>${item.title}</title>
	</head>
	<body><article>${item.content}</article></body>
</html>`;
}
