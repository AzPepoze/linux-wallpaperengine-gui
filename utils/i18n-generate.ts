import fs from 'fs';
import path from 'path';

const i18nDir = path.resolve(process.cwd(), 'src/frontend/svelte/core/i18n');
const localesDir = path.join(i18nDir, 'locales');
const enDir = path.join(localesDir, 'en');
const typesFile = path.resolve(process.cwd(), 'src/frontend/svelte/core/i18n/types.ts');

function generateKeys(obj: any, prefix = ''): string[] {
	let keys: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			keys = keys.concat(generateKeys(v, newKey));
		} else {
			keys.push(newKey);
		}
	}
	return keys;
}

function syncObjects(source: any, target: any, lang: string): any {
	if (typeof source !== 'object' || source === null) {
		return source;
	}
	if (Array.isArray(source)) {
		return Array.isArray(target) ? target : [...source];
	}
	
	const result: any = {};
	const prefix = `[NYT_${lang.toUpperCase()}] `;

	for (const key of Object.keys(source)) {
		if (target && Object.prototype.hasOwnProperty.call(target, key)) {
			if (typeof source[key] === 'object' && source[key] !== null) {
				result[key] = syncObjects(source[key], target[key], lang);
			} else {
				let targetVal = target[key];
				result[key] = targetVal;
			}
		} else {
			if (typeof source[key] === 'string') {
				result[key] = prefix + source[key];
			} else if (typeof source[key] === 'object' && source[key] !== null) {
				result[key] = syncObjects(source[key], {}, lang);
			} else {
				result[key] = source[key];
			}
		}
	}
	return result;
}

if (!fs.existsSync(enDir)) {
	console.error('locales/en directory not found.');
	process.exit(1);
}

const allLangs = fs.readdirSync(localesDir).filter(d => fs.statSync(path.join(localesDir, d)).isDirectory());
const files = fs.readdirSync(enDir).filter((f: string) => f.endsWith('.json'));

for (const lang of allLangs) {
	if (lang === 'en') continue;
	
	const langDir = path.join(localesDir, lang);
	const langFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
	
	for (const file of langFiles) {
		if (!files.includes(file)) {
			fs.unlinkSync(path.join(langDir, file));
			console.log(`Removed extra file: ${lang}/${file}`);
		}
	}
	
	for (const file of files) {
		const enPath = path.join(enDir, file);
		const langPath = path.join(langDir, file);
		const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
		
		if (!fs.existsSync(langPath)) {
			const syncedData = syncObjects(enData, {}, lang);
			fs.writeFileSync(langPath, JSON.stringify(syncedData, null, '\t') + '\n', 'utf-8');
			console.log(`Created and synced missing file: ${lang}/${file}`);
		} else {
			const langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
			const syncedData = syncObjects(enData, langData, lang);
			fs.writeFileSync(langPath, JSON.stringify(syncedData, null, '\t') + '\n', 'utf-8');
		}
	}
}

let allKeys: string[] = [];

for (const file of files) {
	const namespace = file.replace('.json', '');
	const data = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf-8'));
	const keys = generateKeys(data, namespace);
	allKeys = allKeys.concat(keys);
}

const typeDefinition = `// AUTO-GENERATED: DO NOT EDIT DIRECTLY\n\nexport type I18nKey =\n${allKeys.map(k => `\t| '${k}'`).join('\n')}\n\t| (string & {});\n`;

fs.writeFileSync(typesFile, typeDefinition, 'utf-8');
console.log(`Generated ${allKeys.length} keys in ${typesFile}`);
