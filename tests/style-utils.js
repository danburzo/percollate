const { expect } = require('chai');
const css = require('css');

const { extractCss } = require('../src/style-utils');

describe('style utils', () => {
	describe('extractCss', () => {
		it('should stringify the style for the given selector', () => {
			const cssAst = css.parse(`
				.my-element {
					background-color: red;
					width: 100px;
				}
			`);

			const style = extractCss(cssAst, '.my-element');
			expect(style).to.eql('background-color: red;width: 100px');
		});

		it('should return empty string if there are no rules for the given selector', () => {
			const cssAst = css.parse('.my-element {}');

			const style = extractCss(cssAst, '.my-element');
			expect(style).to.eql('');
		});

		it('should return empty string if the selector was not found', () => {
			const cssAst = css.parse('.not-my-element {}');

			const style = extractCss(cssAst, '.my-element');
			expect(style).to.eql('');
		});

		it('should concatenate styles spread accross multiple selectors', () => {
			const cssAst = css.parse(`
				.my-element {
					background: red;
				}
	
				.my-element, body {
					margin: 0;
				}
			`);

			const style = extractCss(cssAst, '.my-element');
			expect(style).to.eql('background: red;margin: 0');
		});

		it('should ignore styles in media queries', () => {
			const cssAst = css.parse(`
				.my-element {
					background: red;
				}
	
				@media print {
					.my-element {
						margin: 0;
					}
				}
			`);

			const style = extractCss(cssAst, '.my-element');
			expect(style).to.eql('background: red');
		});
	});
});
