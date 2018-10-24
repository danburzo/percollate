const fs = require('fs');

/* 
	Naive readability algorithm
*/
module.exports = function(win) {
	let start_time = process.hrtime();

	let ret = {};

	let root = win.document.body;

	function name(node) {
		let name = node.tagName.toLowerCase();
		if (node.id) {
			name += '#' + node.id;
		}
		if (node.className) {
			name += Array.from(node.classList)
				.map(cls => '.' + cls)
				.join('');
		}
		return name;
	}

	function visit(node) {
		// text node
		if (node.nodeType === 3) {
			return {
				name: '',
				size: node.textContent.length
			};
		}

		// element
		let children = Array.from(node.childNodes).filter(
			el => el.nodeType === 1 || el.nodeType === 3
		);

		if (node.children.length) {
			let c = Array.from(children).map(visit);
			let total = c.reduce((acc, curr) => acc + curr.size, 0);
			// parent
			return {
				name: name(node),
				element: node,
				children: c
					.map(i => ({ ...i, weight: i.size / total }))
					.sort((a, b) => b.weight - a.weight),
				size: total
			};
		} else {
			// leaf
			return {
				name: name(node),
				element: node,
				size: node.textContent.length
			};
		}
	}

	let tree = visit(root);

	while (
		tree.children &&
		tree.children.length &&
		tree.children[0].weight >= 0.95
	)
		tree = tree.children[0];

	if (tree && tree.element) {
		let content_element = tree.element;

		// strip classes
		Array.from(content_element.querySelectorAll('*')).forEach(
			el => (el.className = '')
		);

		// remove scripts
		Array.from(content_element.querySelectorAll('script')).forEach(el =>
			el.remove()
		);

		return content_element;
	}
	return null;
};
