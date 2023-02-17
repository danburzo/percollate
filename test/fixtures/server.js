import { createServer } from 'node:http';

const server = createServer((req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/html;charset=utf-8'
	});

	res.write(`
		<!doctype html>
		<html>
			<head>
				<title>Hello</title>
				<meta http-equiv="Content-Type" content="text/html;charset=iso-8859-1" />
			</head>
			<body>Hello there</body>
		</html>
	`);

	res.end();
});

server.listen(8000);
