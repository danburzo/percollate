/*
	Replace the element type (tag name) of an element.
	Does not copy over the children elements (yet).
 */
module.exports = function(el, type, doc) {
	if (el.parentNode) {
		let new_el = doc.createElement(type);
		for (let attr of el.attributes) {
			new_el.setAttribute(attr.name, attr.value);
		}
		el.parentNode.replaceChild(new_el, el);
	}
};
