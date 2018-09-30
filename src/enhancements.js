function imagesAtFullSize(doc) {
	Array.from(doc.querySelectorAll('a > img:only-child')).forEach(img => {
		let anchor = img.parentNode;
		img.setAttribute('src', anchor.href);
		anchor.parentNode.replaceChild(img, anchor);
	});

	/*
		Remove width/height attributes from <img> elements
	 */
	Array.from(doc.querySelectorAll('img')).forEach(img => {
		img.removeAttribute('width');
		img.removeAttribute('height');
	});
}

module.exports = {
	imagesAtFullSize
};
