const tape = require('tape');
const { JSDOM } = require('jsdom');
const {
	wikipediaSpecific,
	githubSpecific,
	imagesAtFullSize,
	wrapPreBlocks
} = require('../src/enhancements');

const dom = content => new JSDOM(content).window.document;

tape('wikipediaSpecific', t => {
	const doc1 = dom`
        <div class='normal-element'>Hello world</div>
        <span class='normal-element'>Hello</span>
    `;
	wikipediaSpecific(doc1);
	t.equal(
		doc1.querySelectorAll('.normal-element').length,
		2,
		'should leave non-wikipedia specific content untouched'
	);

	const doc = dom`
        <div class='normal-element'>Hello world</div>
        <span class='mw-editsection'>Hello</span>
        <span class='normal-element'>Hello</span>
    `;

	t.notEqual(doc.querySelector('.mw-editsection'), null);

	wikipediaSpecific(doc);

	// Post-enhancement, edit link should be removed
	t.equal(
		doc.querySelector('.mw-editsection'),
		null,
		'should remove all edit links'
	);

	// Other elements remain unaffected
	t.equal(doc.querySelectorAll('.normal-element').length, 2);

	t.end();
});

tape('imagesAtFullSize', t => {
	t.test('should strip width and height from all img element', t => {
		const doc1 = dom(`
	        <img src='image.png' width=500 height=200 />
	        <div>
	            <img src='imagew.png' width=100 height=200 />
	        </div>
	    `);

		doc1.querySelectorAll('img').forEach($img => {
			t.notEqual($img.width, 0);
			t.notEqual($img.height, 0);
		});

		imagesAtFullSize(doc1);

		doc1.querySelectorAll('img').forEach($img => {
			t.equal($img.width, 0);
			t.equal($img.height, 0);
		});
		t.end();
	});

	t.test(
		'should unlink linked img elements if the link points to an image',
		t => {
			const doc = dom`
            <a href="/wow.png">
                <img src='/wow.png' width=500 height=200 />
            </a>
        `;

			t.notEqual(doc.querySelector('a'), null);

			imagesAtFullSize(doc);

			t.equal(doc.querySelector('a'), null);
			t.notEqual(doc.querySelector('img'), null);
			t.end();
		}
	);

	t.test(
		'should not unlink linked img elements if the link doesnt point to an image',
		t => {
			const doc = dom`
            <a href="/some-random-link">
                <img src='image.png' width=500 height=200 />
            </a>
        `;

			t.notEqual(doc.querySelector('a'), null);
			t.equal(doc.querySelector('img').src, 'image.png');

			imagesAtFullSize(doc);

			t.notEqual(doc.querySelector('a'), null);
			t.equal(doc.querySelector('img').src, 'image.png');

			t.end();
		}
	);

	t.test(
		'should change image source to the link for linked img elements',
		t => {
			const doc = dom`
            <a href="/wow.png">
                <img src='image.png' width=500 height=200 />
            </a>
        `;

			t.equal(doc.querySelector('img').src, 'image.png');

			imagesAtFullSize(doc);

			t.equal(doc.querySelector('img').src, '/wow.png');
			t.end();
		}
	);
});

tape('githubSpecific', t => {
	const doc = dom`
		<h2>
			<a class='anchor' id='user-content-some-anchor' href='#some-anchor'>
				<svg></svg>
			</a>
			My heading
		</h2>
	`;

	githubSpecific(doc);

	t.equal(
		doc.querySelector('h2 a').getAttribute('id'),
		'some-anchor',
		'fix GitHub anchors'
	);

	t.end();
});

tape('wrapPreBlocks', t => {
	const doc1 = dom`
		<p>Here is the command:</p>
		<pre>cd my-app/</pre>`;

	wrapPreBlocks(doc1);

	t.equal(
		doc1.body.innerHTML,
		`<p>Here is the command:</p>
		<figure><pre>cd my-app/</pre></figure>`,
		'Wraps <pre> when appropriate'
	);

	const doc2 = dom`
		<p>Here is the command:</p>
		<figure><pre>cd my-app/</pre><figcaption>The command</figcaption></figure>`;

	wrapPreBlocks(doc2);

	t.equal(
		doc2.body.innerHTML,
		`<p>Here is the command:</p>
		<figure><pre>cd my-app/</pre><figcaption>The command</figcaption></figure>`,
		"Doesn't double-wrap in <figure>"
	);

	const doc3 = dom`
		<p>Here is the command:</p>
		<div><pre>cd my-app/</pre></div>`;

	wrapPreBlocks(doc3);

	t.equal(
		doc3.body.innerHTML,
		`<p>Here is the command:</p>
		<figure><pre>cd my-app/</pre></figure>`,
		'Removes useless wrapping element'
	);

	t.end();
});
