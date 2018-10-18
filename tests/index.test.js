const { expect } = require('chai');

const { bundle, fetchDocument, configure } = require('../src');

const _fetch = require('./helpers/_fetch');

const expectedToFailError = new Error('Resolved promise, expected to fail');

describe('index', () => {
	describe('fetchDocument', () => {
		it('should reject for invalid urls', done => {
			fetchDocument('example.com', { _fetch })
				.then(() => done(expectedToFailError))
				.catch(_ => done());
		});

		it('should get correct title and content for the example document', async () => {
			const { title, textContent, content } = await fetchDocument(
				'http://example.com',
				{ _fetch }
			);

			expect(title).to.eql('Example');
			expect(textContent).to.contain('This is example!');
			expect(content).to.contain('This is example!');
		});

		it('should reject if the result is a rejected promise', done => {
			fetchDocument('http://example.com/error', { _fetch })
				.then(() => done(expectedToFailError))
				.catch(e => done());
		});
	});
});
