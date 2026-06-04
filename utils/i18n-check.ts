import fs from 'fs';
import path from 'path';

const i18nDir = path.resolve(process.cwd(), 'src/frontend/svelte/i18n');
const localesDir = path.join(i18nDir, 'locales');
const enDir = path.join(localesDir, 'en');

function getKeys(obj: any, prefix = ''): string[] {
	let keys: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			keys = keys.concat(getKeys(v, newKey));
		} else {
			keys.push(newKey);
		}
	}
	return keys;
}

const enKeys = new Set<string>();
const files = fs.readdirSync(enDir).filter((f: string) => f.endsWith('.json'));

for (const file of files) {
	const namespace = file.replace('.json', '');
	const data = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf-8'));
	const keys = getKeys(data, namespace);
	keys.forEach(k => enKeys.add(k));
}

const otherLocales = fs.readdirSync(localesDir).filter((d: string) => d !== 'en' && fs.statSync(path.join(localesDir, d)).isDirectory());

let hasMissing = false;

for (const locale of otherLocales) {
	const localeDir = path.join(localesDir, locale);
	const localeKeys = new Set<string>();
	
	if (fs.existsSync(localeDir)) {
		const localeFiles = fs.readdirSync(localeDir).filter((f: string) => f.endsWith('.json'));
		for (const file of localeFiles) {
			const namespace = file.replace('.json', '');
			const data = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf-8'));
			const keys = getKeys(data, namespace);
			keys.forEach(k => localeKeys.add(k));
		}
	}

	const missing = Array.from(enKeys).filter(k => !localeKeys.has(k));
	if (missing.length > 0) {
		console.log(`\nLocale '${locale}' is missing ${missing.length} keys:`);
		missing.forEach(k => console.log(`  - ${k}`));
		hasMissing = true;
	} else {
		console.log(`\nLocale '${locale}' is up to date!`);
	}
}

if (hasMissing) {
	console.log(`\n\x1b[33mNote: Missing keys are treated as warnings and will fallback to English.\x1b[0m`);
	process.exit(2);
}
