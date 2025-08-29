const formatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium'
});

export default function humanDate(d) {
	return formatter.format(d);
}
