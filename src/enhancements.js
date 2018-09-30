function imagesAtFullSize(doc) {
	Array.from(doc.querySelectorAll('a > img:only-child')).forEach(img => {
		let anchor = img.parentNode;
		img.setAttribute('src', anchor.href);
		img.removeAttribute('width');
		img.removeAttribute('height');
		anchor.parentNode.replaceChild(img, anchor);
	});
}

module.exports = {
	imagesAtFullSize
};