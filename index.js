const pup = require('puppeteer');

(async () => {
	const browser = await pup.launch({
		headless: true
	});
	const page = await browser.newPage();
	await page.goto('', { waitUntil: 'networkidle2' });
	await page.pdf({ path: 'some.pdf', format: 'A4' });
	await browser.close();
})();