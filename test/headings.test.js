import tape from 'tape';
import { JSDOM } from 'jsdom';
import { setIdsAndReturnHeadings, nestHeadings } from '../src/headings.js';

const dom = content => new JSDOM(content).window.document.firstChild;

/* remove props that are hard to test */
function mapHeading(h) {
	let res = {
		level: h.level,
		text: h.node.textContent.trim()
	};
	if (h.subheadings) {
		res.subheadings = h.subheadings.map(mapHeading);
	}
	return res;
}

tape('setIdsAndReturnHeadings', t => {
	const el = dom(`
		<h2>Chapter 1</h2>
		<p>Content</p>
		<h3>Chapter 1.1</h3>
		<p>Content</p>
		<h4>Chapter 1.1.1</h4>
		<h3>Chapter 1.2</h3>
		<p>Content</p>
		<h2>Chapter 2</h2>
		<h3>Chapter 2.1</h3>
		<h5>Chapter 2.1.1.1</h5>
		<p>Content</p>
		<h3>Chapter 2.2</h3>
		<h6>Chapter 2.2.1.1.1</h6>
		<p>Content</p>
	`);
	t.deepEqual(setIdsAndReturnHeadings([el], 2).map(mapHeading), [
		{ level: 2, text: 'Chapter 1' },
		{ level: 2, text: 'Chapter 2' }
	]);
	t.deepEqual(setIdsAndReturnHeadings([el], 3).map(mapHeading), [
		{ level: 2, text: 'Chapter 1' },
		{ level: 3, text: 'Chapter 1.1' },
		{ level: 3, text: 'Chapter 1.2' },
		{ level: 2, text: 'Chapter 2' },
		{ level: 3, text: 'Chapter 2.1' },
		{ level: 3, text: 'Chapter 2.2' }
	]);
	t.deepEqual(setIdsAndReturnHeadings([el], 4).map(mapHeading), [
		{ level: 2, text: 'Chapter 1' },
		{ level: 3, text: 'Chapter 1.1' },
		{ level: 4, text: 'Chapter 1.1.1' },
		{ level: 3, text: 'Chapter 1.2' },
		{ level: 2, text: 'Chapter 2' },
		{ level: 3, text: 'Chapter 2.1' },
		{ level: 3, text: 'Chapter 2.2' }
	]);
	t.deepEqual(setIdsAndReturnHeadings([el], 6).map(mapHeading), [
		{ level: 2, text: 'Chapter 1' },
		{ level: 3, text: 'Chapter 1.1' },
		{ level: 4, text: 'Chapter 1.1.1' },
		{ level: 3, text: 'Chapter 1.2' },
		{ level: 2, text: 'Chapter 2' },
		{ level: 3, text: 'Chapter 2.1' },
		{ level: 5, text: 'Chapter 2.1.1.1' },
		{ level: 3, text: 'Chapter 2.2' },
		{ level: 6, text: 'Chapter 2.2.1.1.1' }
	]);
	t.end();
});

tape('nestHeadings', t => {
	const el = dom(`
		<h2>Chapter 1</h2>
		<p>Content</p>
		<h3>Chapter 1.1</h3>
		<p>Content</p>
		<h4>Chapter 1.1.1</h4>
		<h3>Chapter 1.2</h3>
		<p>Content</p>
		<h2>Chapter 2</h2>
		<h3>Chapter 2.1</h3>
		<h5>Chapter 2.1.1.1</h5>
		<p>Content</p>
		<h3>Chapter 2.2</h3>
		<h6>Chapter 2.2.1.1.1</h6>
		<p>Content</p>
	`);
	t.deepEqual(
		nestHeadings(setIdsAndReturnHeadings([el], 3)).map(mapHeading),
		[
			{
				level: 2,
				text: 'Chapter 1',
				subheadings: [
					{ level: 3, text: 'Chapter 1.1', subheadings: [] },
					{ level: 3, text: 'Chapter 1.2', subheadings: [] }
				]
			},
			{
				level: 2,
				text: 'Chapter 2',
				subheadings: [
					{ level: 3, text: 'Chapter 2.1', subheadings: [] },
					{ level: 3, text: 'Chapter 2.2', subheadings: [] }
				]
			}
		]
	);
	t.deepEqual(
		nestHeadings(setIdsAndReturnHeadings([el], 6)).map(mapHeading),
		[
			{
				level: 2,
				text: 'Chapter 1',
				subheadings: [
					{
						level: 3,
						text: 'Chapter 1.1',
						subheadings: [
							{ level: 4, text: 'Chapter 1.1.1', subheadings: [] }
						]
					},
					{ level: 3, text: 'Chapter 1.2', subheadings: [] }
				]
			},
			{
				level: 2,
				text: 'Chapter 2',
				subheadings: [
					{
						level: 3,
						text: 'Chapter 2.1',
						subheadings: [
							{
								level: 5,
								text: 'Chapter 2.1.1.1',
								subheadings: []
							}
						]
					},
					{
						level: 3,
						text: 'Chapter 2.2',
						subheadings: [
							{
								level: 6,
								text: 'Chapter 2.2.1.1.1',
								subheadings: []
							}
						]
					}
				]
			}
		]
	);
	t.end();
});
