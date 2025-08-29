/* 
	A minimal HTML shell for a DOM fragment,
	such as the content of a XML feed entry,
	to pass to the JSDOM constructor.
*/
export default function wrapHTMLFragment(item) {
	return `
		<!doctype html>
		<html>
			<head>
				<title>${item.title || ''}</title>
			</head>
			<body>
				<article>${item.content || ''}</article>
			</body>
		</html>
	`;
}
