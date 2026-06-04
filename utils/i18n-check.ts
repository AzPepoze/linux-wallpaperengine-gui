import fs from 'fs';
import path from 'path';

const i18nDir = path.resolve(process.cwd(), 'src/frontend/svelte/i18n');
const localesDir = path.join(i18nDir, 'locales');
const enDir = path.join(localesDir, 'en');

function getKeysAndValues(obj: any, prefix = ''): {key: string, value: any}[] {
	let results: {key: string, value: any}[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			results = results.concat(getKeysAndValues(v, newKey));
		} else {
			results.push({key: newKey, value: v});
		}
	}
	return results;
}

const enKeys = new Set<string>();
const files = fs.readdirSync(enDir).filter((f: string) => f.endsWith('.json'));

for (const file of files) {
	const namespace = file.replace('.json', '');
	const data = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf-8'));
	const kv = getKeysAndValues(data, namespace);
	kv.forEach(item => enKeys.add(item.key));
}

const otherLocales = fs.readdirSync(localesDir).filter((d: string) => d !== 'en' && fs.statSync(path.join(localesDir, d)).isDirectory());

let hasMissing = false;

for (const locale of otherLocales) {
	const localeDir = path.join(localesDir, locale);
	const localeKeys = new Map<string, any>();
	
	if (fs.existsSync(localeDir)) {
		const localeFiles = fs.readdirSync(localeDir).filter((f: string) => f.endsWith('.json'));
		for (const file of localeFiles) {
			const namespace = file.replace('.json', '');
			const data = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf-8'));
			const kv = getKeysAndValues(data, namespace);
			kv.forEach(item => localeKeys.set(item.key, item.value));
		}
	}

	const missing = Array.from(enKeys).filter(k => {
		if (!localeKeys.has(k)) return true;
		const val = localeKeys.get(k);
		if (typeof val === 'string' && val.startsWith('[NYT_')) return true;
		return false;
	});
	if (missing.length > 0) {
		console.log(`\nLocale '${locale}' is missing ${missing.length} keys:`);
		missing.forEach(k => console.log(`  - ${k}`));
		hasMissing = true;
	} else {
		console.log(`\nLocale '${locale}' is up to date!`);
	}
}

if (hasMissing) {
	console.log(`\n\x1b[33mNote: Missing/Not Yet Translated keys are treated as warnings and will fallback to English.\x1b[0m`);
	process.exit(2);
}
