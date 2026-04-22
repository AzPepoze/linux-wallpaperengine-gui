export function colorizeLog(text: string): string {
	if (!text) return "";

	// Basic HTML escaping
	let escaped = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	// Colorize prefixes
	escaped = escaped.replace(
		/^\[Backend\]/i,
		'<span class="prefix-backend">$&</span>'
	);
	escaped = escaped.replace(
		/^\[Electron\]/i,
		'<span class="prefix-electron">$&</span>'
	);
	escaped = escaped.replace(
		/^\[Wallpaper\]/i,
		'<span class="prefix-wallpaper">$&</span>'
	);
	escaped = escaped.replace(
		/^\[Frontend\]/i,
		'<span class="prefix-frontend">$&</span>'
	);

	// Colorize status keywords
	escaped = escaped.replace(
		/\b(FATAL|ERROR|Failed|Error)\b/g,
		'<span class="status-error">$&</span>'
	);
	escaped = escaped.replace(
		/\b(WARNING|WARN|Warning)\b/g,
		'<span class="status-warning">$&</span>'
	);
	escaped = escaped.replace(
		/\b(SUCCESS|OK|Success|Started|Connected)\b/g,
		'<span class="status-success">$&</span>'
	);

	return escaped;
}
