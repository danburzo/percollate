import { randomUUID as uuid } from 'node:crypto';

const HEADING_LEVELS = {
	H2: 2,
	H3: 3,
	H4: 4,
	H5: 5,
	H6: 6
};

/*
	Sets unique IDs for the matched headings
	and returns information about these headings.
*/
export function setIdsAndReturnHeadings(domElements, max_level) {
	const res = [];
	domElements.forEach(el => {
		el.querySelectorAll('h2, h3, h4, h5, h6').forEach(heading => {
			const level = HEADING_LEVELS[heading.tagName];
			if (level <= max_level) {
				const id = `h-${uuid()}`;
				heading.setAttribute('id', id);
				res.push({
					id,
					level,
					node: heading
				});
			}
		});
	});
	return res;
}

/*
	Create a nested table of contents
	from a flat list of headings.
*/
export function nestHeadings(headings) {
	const root = {
		level: 1,
		subheadings: []
	};
	let ref = root;
	headings.forEach(heading => {
		const node = {
			...heading,
			subheadings: []
		};
		/* 
			The insertion point for the current heading
			is under a heading of a lower level.
		*/
		while (node.level <= ref.level) {
			ref = ref.parent;
		}
		if (ref?.subheadings) {
			node.parent = ref;
			ref.subheadings.push(node);
			ref = node;
		}
	});
	return root.subheadings;
}
