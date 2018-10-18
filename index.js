const { bundle, fetchDocument, configure } = require('./src');

/*
	Generate PDF
 */
async function pdf(urls, options) {
	let items = [];
	for (let url of urls) {
		items.push(await fetchDocument(url));
	}
	bundle(items, options);
}

/*
	Generate EPUB
 */
async function epub(urls, options) {
	console.log('TODO', urls, options);
}

/*
	Generate HTML
 */
async function html(urls, options) {
	console.log('TODO', urls, options);
}

module.exports = { configure, pdf, epub, html };
