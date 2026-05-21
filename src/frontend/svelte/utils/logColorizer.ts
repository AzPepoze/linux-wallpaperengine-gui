export interface ParsedLog {
	raw: string;
	timestamp: string;      // YYYY/MM/DD HH:MM:SS
	timeOnly: string;       // HH:MM:SS
	dateOnly: string;       // YYYY/MM/DD
	prefix: string;         // Backend, Electron, Wallpaper, Frontend, or Empty
	level: 'info' | 'success' | 'warning' | 'error';
	message: string;        // Clean message
}

export function parseLogLine(text: string): ParsedLog {
	if (!text) {
		return {
			raw: "",
			timestamp: "",
			timeOnly: "",
			dateOnly: "",
			prefix: "",
			level: "info",
			message: ""
		};
	}

	const tsMatch = text.match(/^(\d{4}\/\d{2}\/\d{2}) (\d{2}:\d{2}:\d{2})\s?(.*)$/);
	let dateOnly = "";
	let timeOnly = "";
	let rest = text;

	if (tsMatch) {
		dateOnly = tsMatch[1];
		timeOnly = tsMatch[2];
		rest = tsMatch[3];
	}

	// Check prefix inside rest
	const prefixMatch = rest.match(/^\[(Backend|Electron|Wallpaper|Frontend)\]\s?(.*)$/i);
	let prefix = "";
	let message = rest;

	if (prefixMatch) {
		prefix = prefixMatch[1];
		message = prefixMatch[2];
	}

	// Determine log level based on message content
	let level: 'info' | 'success' | 'warning' | 'error' = 'info';
	if (/\b(FATAL|ERROR|Failed|Error)\b/i.test(message)) {
		level = 'error';
	} else if (/\b(WARNING|WARN|Warning)\b/i.test(message)) {
		level = 'warning';
	} else if (/\b(SUCCESS|OK|Success|Started|Connected)\b/i.test(message)) {
		level = 'success';
	}

	return {
		raw: text,
		timestamp: tsMatch ? `${dateOnly} ${timeOnly}` : "",
		timeOnly,
		dateOnly,
		prefix,
		level,
		message
	};
}

export function colorizeMessage(message: string): string {
	if (!message) return "";

	// Basic HTML escaping
	let escaped = message
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

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

export function colorizeLog(text: string): string {
	if (!text) return "";
	const parsed = parseLogLine(text);
	const escapedMsg = colorizeMessage(parsed.message);

	let prefixHtml = "";
	if (parsed.prefix) {
		const prefixLower = parsed.prefix.toLowerCase();
		prefixHtml = `<span class="prefix-${prefixLower}">[${parsed.prefix}]</span> `;
	}

	let timeHtml = "";
	if (parsed.timestamp) {
		timeHtml = `<span class="log-time">${parsed.timestamp}</span> `;
	}

	return `${timeHtml}${prefixHtml}${escapedMsg}`;
}

export function highlightText(html: string, query: string): string {
	if (!query) return html;
	const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	const regex = new RegExp(`(${escapedQuery})(?![^<>]*>)`, 'gi');
	return html.replace(regex, '<mark class="log-highlight">$1</mark>');
}

