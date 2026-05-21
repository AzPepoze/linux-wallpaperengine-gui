import MarkdownIt from 'markdown-it';
import type {
	WallpaperProperty,
	PropertyType
} from '@shared/types';

const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
	breaks: true
});

export function renderMarkdown(text: string): string {
	if (!text) return '';

	const processed = text
		.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
		.replace(/<big>(.*?)<\/big>/gi, (_, content) => {
			if (content.length < 50) return `\n\n## ${content}\n\n`;
			return `\n\n<div class="big-text">${content}</div>\n\n`;
		})
		.replace(/<br\s*\/?>/gi, '  \n');

	return md.render(processed);
}

export function getLabelParts(prop: WallpaperProperty) {
	if (prop.name === 'schemecolor') {
		return { header: '', label: 'Theme Color', isPureHeader: false };
	}

	const rawText = prop.description || prop.name;
	const text = rawText.trim();

	if (!text.startsWith('<')) {
		return { header: '', label: rawText, isPureHeader: false };
	}

	const hasBigHeaderTags =
		/<(h[1-6]|hr|big|img|p|div|center|br)\b/i.test(text);

	if (hasBigHeaderTags) {
		const plainText = text.replace(/<[^>]*>/g, '').trim();
		const isPure =
			plainText.length === 0 ||
			/^<(hr|h[1-6]|big|img)\b/i.test(text);
		if (isPure) {
			return { header: text, label: '', isPureHeader: true };
		}
	}

	const blockTags = ['hr', 'br', 'img', 'h[1-6]', 'big', 'p', 'div'];
	const leadingTagPattern = blockTags
		.map(
			(t) =>
				`<${t}\b[^>]*>.*?<\/${t.replace('[1-6]', 'd')}>` +
				`|<${t}\b[^>]*\/?>`
		)
		.join('|');

	const match = text.match(
		new RegExp(`^((?:\\s|${leadingTagPattern})+)(.*)$`, 'is')
	);

	if (match && match[1].trim()) {
		const header = match[1].trim();
		const label = match[2].trim();
		return { header, label, isPureHeader: label.length === 0 };
	}

	return { header: '', label: rawText, isPureHeader: false };
}

export function parseProperties(rawProperties: Record<string, any>): WallpaperProperty[] {
	const parsed: WallpaperProperty[] = [];
	for (const [name, data] of Object.entries(rawProperties)) {
		let options: Record<string, string> = {};
		if (Array.isArray(data.options)) {
			data.options.forEach((opt: any) => {
				options[opt.label || opt.text || opt.value] = String(
					opt.value
				);
			});
		} else if (typeof data.options === 'object') {
			options = data.options;
		}

		let type = data.type || 'unknown';
		if (type === 'bool') type = 'boolean';
		if (type === 'combo') type = 'combolist';

		parsed.push({
			name,
			type: type as PropertyType,
			description: data.text || name,
			value: data.value,
			min: data.min,
			max: data.max,
			step: data.step,
			options:
				Object.keys(options).length > 0 ? options : undefined
		});
	}
	return parsed.sort(
		(a, b) =>
			(rawProperties[a.name].order ?? 0) -
			(rawProperties[b.name].order ?? 0)
	);
}
