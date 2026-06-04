import { writable, derived } from 'svelte/store';
import type { I18nKey } from './types';

type Dict = Record<string, any>;

const modules = import.meta.glob('./locales/*/*.json', { eager: true });
const dictionaries: Record<string, Dict> = {};

for (const path in modules) {
	const parts = path.split('/');
	if (parts.length >= 4) {
		const lang = parts[2];
		const namespace = parts[3].replace('.json', '');
		
		if (!dictionaries[lang]) {
			dictionaries[lang] = {};
		}
		dictionaries[lang][namespace] = (modules[path] as any).default;
	}
}

export const locale = writable<string>('en');

function resolveValue(dict: Dict, key: string): string | null {
	const keys = key.split('.');
	let result: any = dict;
	for (const k of keys) {
		if (result == null || typeof result !== 'object') return null;
		result = result[k];
	}
	return typeof result === 'string' ? result : null;
}

function interpolate(text: string, params?: Record<string, any>): string {
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (_, key) => {
		return params[key] !== undefined ? String(params[key]) : `{${key}}`;
	});
}

export const t = derived(locale, ($locale) => {
	const dict = dictionaries[$locale] || dictionaries.en || {};
	const enDict = dictionaries.en || {};
	return (key: I18nKey, params?: Record<string, any>): string => {
		let text = resolveValue(dict, key as string);
		if (text !== null) {
			text = text.replace(/^\[NYT_[A-Z]+\]\s*/, '');
			return interpolate(text, params);
		}
		
		let fallback = resolveValue(enDict, key as string);
		if (fallback !== null) {
			fallback = fallback.replace(/^\[NYT_[A-Z]+\]\s*/, '');
		}
		return interpolate(fallback !== null ? fallback : (key as string), params);
	};
});

export function setLocale(localeCode: string) {
	if (dictionaries[localeCode]) {
		locale.set(localeCode);
	}
}
