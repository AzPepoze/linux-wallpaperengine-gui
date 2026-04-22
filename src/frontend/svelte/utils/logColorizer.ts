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
		'<span class="prefix-backend">$0</span>'
	);
	escaped = escaped.replace(
		/^\[Electron\]/i,
		'<span class="prefix-electron">$0</span>'
	);
	escaped = escaped.replace(
		/^\[Wallpaper\]/i,
		'<span class="prefix-wallpaper">$0</span>'
	);
	escaped = escaped.replace(
		/^\[Frontend\]/i,
		'<span class="prefix-frontend">$0</span>'
	);

	// Colorize status keywords
	escaped = escaped.replace(
		/\b(FATAL|ERROR|Failed|Error)\b/g,
		'<span class="status-error">$0</span>'
	);
	escaped = escaped.replace(
		/\b(WARNING|WARN|Warning)\b/g,
		'<span class="status-warning">$0</span>'
	);
	escaped = escaped.replace(
		/\b(SUCCESS|OK|Success|Started|Connected)\b/g,
		'<span class="status-success">$0</span>'
	);

	return escaped;
}
