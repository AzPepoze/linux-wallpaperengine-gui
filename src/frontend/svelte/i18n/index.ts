import { writable, derived } from 'svelte/store';
import en from './en.json';
import zh from './zh.json';

type Dict = Record<string, any>;

const dictionaries: Record<string, Dict> = { en, zh };

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
	const dict = dictionaries[$locale] || dictionaries.en;
	const enDict = dictionaries.en;
	return (key: string, params?: Record<string, any>): string => {
		const text = resolveValue(dict, key);
		if (text !== null) return interpolate(text, params);
		const fallback = resolveValue(enDict, key);
		return interpolate(fallback !== null ? fallback : key, params);
	};
});

export function setLocale(localeCode: string) {
	if (dictionaries[localeCode]) {
		locale.set(localeCode);
	}
}
