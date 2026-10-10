import type { FilterCategory } from '@shared/filterConstants';
import type { FilterConfig } from '@shared/types';

type TagMap = Record<string, boolean>;

function isTagMap(value: unknown): value is TagMap {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeValue(defaultValue: unknown, savedValue: unknown): unknown {
	if (isTagMap(defaultValue) && isTagMap(savedValue)) {
		return { ...defaultValue, ...savedValue };
	}
	return savedValue;
}

// Saved tag maps can predate newer tags, so defaults fill any missing keys.
export function mergeFilterConfig(
	defaults: FilterConfig,
	saved: Partial<FilterConfig> | null | undefined
): FilterConfig {
	const merged: FilterConfig = { ...defaults };

	for (const key of Object.keys(saved ?? {}) as (keyof FilterConfig)[]) {
		Object.assign(merged, {
			[key]: mergeValue(defaults[key], saved?.[key])
		});
	}

	return merged;
}

export function setTags(
	config: FilterConfig,
	key: keyof FilterConfig,
	items: string[],
	state: boolean
): FilterConfig {
	const nextTags: TagMap = { ...((config[key] as TagMap | undefined) ?? {}) };
	for (const item of items) {
		nextTags[item] = state;
	}
	return { ...config, [key]: nextTags };
}

export function toggleTag(
	config: FilterConfig,
	key: keyof FilterConfig,
	item: string
): FilterConfig {
	const tags = (config[key] as TagMap | undefined) ?? {};
	return setTags(config, key, [item], !tags[item]);
}

export function getCategoryItems(category: FilterCategory): string[] {
	const groupItems = (category.groups ?? []).flatMap((group) => group.items);
	return [...(category.items ?? []), ...groupItems];
}
