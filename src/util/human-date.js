const dateTimeFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
	timeStyle: 'short'
});

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium'
});

export default function humanDate(date, includeTime = false) {
	const d = new Date(date);
	return includeTime ? dateTimeFormatter.format(d) : dateFormatter.format(d);
}
