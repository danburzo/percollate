/*
	Markdown options
	See: https://github.com/syntax-tree/mdast-util-to-markdown
*/
export const AVAILABLE_MARKDOWN_OPTIONS = new Set([
	'bullet',
	'bulletOther',
	'bulletOrdered',
	'bulletOrderedOther',
	'closeAtx',
	'emphasis',
	'fence',
	'fences',
	'incrementListMarker',
	'listItemIndent',
	'quote',
	'resourceLink',
	'rule',
	'ruleRepetition',
	'ruleSpaces',
	'setext',
	'strong',
	'tightDefinitions'
]);

export const DEFAULT_MARKDOWN_OPTIONS = {
	fences: true,
	emphasis: '_',
	strong: '_',
	resourceLink: true,
	rule: '-'
};
