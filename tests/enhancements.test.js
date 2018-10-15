const { JSDOM } = require('jsdom');
const { expect } = require('chai');

const { wikipediaSpecific, imagesAtFullSize } = require('../src/enhancements');

describe('Page enhancements', () => {
	const createDocument = content => new JSDOM(content).window.document;

	describe('wikipediaSpecific', () => {
		it('should remove all edit links', () => {
			const doc = createDocument(`
                <div class='normal-element'>Hello world</div>
                <span class='mw-editsection'>Hello</span>
                <span class='normal-element'>Hello</span>
            `);

			expect(doc.querySelector('.mw-editsection')).not.to.eql(null);

			wikipediaSpecific(doc);

			// Post-enhancement, edit link should be removed
			expect(doc.querySelector('.mw-editsection')).to.eql(null);

			// Other elements remain unaffected
			expect(doc.querySelectorAll('.normal-element').length).to.eql(2);
		});
	});
});
