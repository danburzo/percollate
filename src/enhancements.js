function imagesAtFullSize(doc) {
	/*
		Replace:
			<a href='original-size.png'>
				<img src='small-size.png'/>
			</a>

		With:
			<img src='original-size.png'/>
	 */
	Array.from(doc.querySelectorAll('a > img:only-child')).forEach(img => {
		let anchor = img.parentNode;
		let original = anchor.href;

		// only replace if the HREF matches an image file
		if (original.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
			img.setAttribute('src', original);
			anchor.parentNode.replaceChild(img, anchor);
		}
	});

	/*
		Remove width/height attributes from <img> elements
		and style them in CSS. (Should we do this, actually?)
	 */
	Array.from(doc.querySelectorAll('img')).forEach(img => {
		img.removeAttribute('width');
		img.removeAttribute('height');
	});
}

function wikipediaSpecific(doc) {
	/*
		Remove some screen-only things from wikipedia pages:
		- edit links next to headings
	 */
	Array.from(doc.querySelectorAll('.mw-editsection')).forEach(el =>
		el.remove()
	);
}

module.exports = {
	imagesAtFullSize,
	wikipediaSpecific
};
