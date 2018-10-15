const { JSDOM } = require('jsdom');
const { expect } = require('chai');

const { wikipediaSpecific, imagesAtFullSize } = require('../src/enhancements');

const createDoc = content => new JSDOM(content).window.document;

describe('Page enhancements', () => {
	describe('wikipediaSpecific', () => {
		it('should leave non-wikipedia specific content untouched', () => {
			const doc = createDoc(`
                <div class='normal-element'>Hello world</div>
                <span class='normal-element'>Hello</span>
            `);

			wikipediaSpecific(doc);

			expect(doc.querySelectorAll('.normal-element').length).to.eql(2);
		});

		it('should remove all edit links', () => {
			const doc = createDoc(`
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

	describe('imagesAtFullSize', () => {
		it('should strip width and height from all img element', () => {
			const doc = createDoc(`
                <img src='image.png' width=500 height=200 />
                <div>
                    <img src='imagew.png' width=100 height=200 />
                </div>
            `);

			doc.querySelectorAll('img').forEach($img => {
				expect($img.width).not.to.eql(0);
				expect($img.height).not.to.eql(0);
			});

			imagesAtFullSize(doc);

			doc.querySelectorAll('img').forEach($img => {
				expect($img.width).to.eql(0);
				expect($img.height).to.eql(0);
			});
		});

		it('should unlink linked img elements if the link points to an image', () => {
			const doc = createDoc(`
                <a href="/wow.png">
                    <img src='/wow.png' width=500 height=200 />
                </a>
            `);

			expect(doc.querySelector('a')).not.to.eql(null);

			imagesAtFullSize(doc);

			expect(doc.querySelector('a')).to.eql(null);
			expect(doc.querySelector('img')).not.to.eql(null);
		});

		it('should not unlink linked img elements if the link doesnt point to an image', () => {
			const doc = createDoc(`
                <a href="/some-random-link">
                    <img src='image.png' width=500 height=200 />
                </a>
            `);

			expect(doc.querySelector('a')).not.to.eql(null);
			expect(doc.querySelector('img').src).to.eql('image.png');

			imagesAtFullSize(doc);

			expect(doc.querySelector('a')).not.to.eql(null);
			expect(doc.querySelector('img').src).to.eql('image.png');
		});

		it('should change image source to the link for linked img elements', () => {
			const doc = createDoc(`
                <a href="/wow.png">
                    <img src='image.png' width=500 height=200 />
                </a>
            `);

			expect(doc.querySelector('img').src).to.eql('image.png');

			imagesAtFullSize(doc);

			expect(doc.querySelector('img').src).to.eql('/wow.png');
		});
	});
});
