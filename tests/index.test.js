const { expect } = require('chai');
// const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs');

const { bundle, fetchDocument, configure } = require('../src');

const _fetch = require('./helpers/_fetch');
const { shouldFail } = require('./helpers/utils');

describe('index', () => {
	describe('fetchDocument', () => {
		it('should reject for invalid urls', done => {
			shouldFail(done, fetchDocument('example.com', { _fetch }));
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
			shouldFail(
				done,
				fetchDocument('http://example.com/error', { _fetch })
			);
		});
	});

	describe('bundle', () => {
		beforeEach(() => {
			// mockFs({
			// 	'/my-dir': {},
			// 	'templates': {
			// 		'default.css': mockFs.file({
			// 			content: '.my-css { color: red; }'
			// 		}),
			// 		'default.html': mockFs.file({
			// 			content: `<div>
			// 				{% for item in items %}
			// 					{{ item.title }}
			// 				{% endfor %}
			// 			</div>`,
			// 		}),
			// 	}
			// });
		});

		afterEach(() => {
			// mockFs.restore();
		});

		it('should generate pdf file with the corrent content', async () => {});

		it('should generate pdf file with the corrent number of pages', () => {});

		it('should render styles', () => {});

		it('should render load stylesheet', () => {});
	});
});
