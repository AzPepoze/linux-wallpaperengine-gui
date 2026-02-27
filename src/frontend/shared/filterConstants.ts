import type { FilterConfig } from './types';

export interface FilterGroup { name: string; items: string[]; }
export interface FilterCategory {
	name: string;
	items: string[];
	groups?: FilterGroup[];
	internalKey: keyof FilterConfig;
}

export const CATEGORY_MAP: Partial<Record<keyof FilterConfig, string>> = {
	typetags: 'Type',
	tags: 'Genre',
	ratingtags: 'Age Rating',
	resolutiontags: 'Resolution',
	categorytags: 'Category',
	sourcetags: 'Source',
	utilitytags: 'Miscellaneous'
};

const commonResolutions = {
	"1280 x 720": true, "1366 x 768": true, "1920 x 1080": true, "2560 x 1440": true, "3840 x 2160": true,
	"Dual 3840 x 1080": true, "Dual 5120 x 1440": true, "Dual 7680 x 2160": true, "Dual Standard Definition": true,
	"Dynamic resolution": true, "Other resolution": true,
	"Portrait 1080 x 1920": true, "Portrait 1440 x 2560": true, "Portrait 2160 x 3840": true, "Portrait 720 x 1280": true, "Portrait Standard Definition": true,
	"Standard Definition": true,
	"Triple 11520 x 2160": true, "Triple 4096 x 768": true, "Triple 5760 x 1080": true, "Triple 7680 x 1440": true, "Triple Standard Definition": true,
	"Ultrawide 2560 x 1080": true, "Ultrawide 3440 x 1440": true, "Ultrawide Standard Definition": true
};

const commonTags = {
	"Abstract": true, "Animal": true, "Anime": true, "CGI": true, "Cartoon": true, "Cyberpunk": true,
	"Fantasy": true, "Game": true, "Girls": true, "Guys": true, "Landscape": true, "MMD": true,
	"Medieval": true, "Memes": true, "Music": true, "Nature": true, "Pixel art": true, "Relaxing": true,
	"Retro": true, "Sci-Fi": true, "Sports": true, "Technology": true, "Television": true, "Vehicle": true
};

export const DEFAULT_INSTALLED_FILTER_CONFIG: FilterConfig = {
	categorytags: { "Preset": true, "Wallpaper": true },
	descending: false,
	ratingtags: { "Everyone": true, "Mature": false, "Questionable": false },
	resolutiontags: { ...commonResolutions },
	sort: "name",
	sourcetags: { "Local": true, "Official": true, "Workshop": true },
	tags: { ...commonTags, "Unspecified": true },
	type: "",
	typetags: { "Application": true, "Scene": true, "Video": true, "Web": true },
	utilitytags: {}
};

export const DEFAULT_WORKSHOP_FILTER_CONFIG: FilterConfig = {
	categorytags: { "Preset": true, "Wallpaper": true },
	descending: false,
	ratingtags: { "Everyone": true, "Mature": false, "Questionable": false },
	resolutiontags: { ...commonResolutions },
	sort: "trend_year",
	sourcetags: { "Local": true, "Official": true, "Workshop": true },
	tags: { ...commonTags, "Unspecified": false },
	type: "",
	typetags: { "Application": false, "Scene": true, "Video": true, "Web": true },
	utilitytags: {}
};

export const DEFAULT_FILTER_CONFIG = DEFAULT_INSTALLED_FILTER_CONFIG;

export const mapCategoryToInternal = (name: string): keyof FilterConfig =>
	Object.entries(CATEGORY_MAP).find(([_, v]) => v === name)?.[0] as keyof FilterConfig || 'tags';

export const FILTER_CATEGORIES: FilterCategory[] = [
	{ name: 'Type', internalKey: 'typetags', items: ["Application", "Scene", "Video", "Web"] },
	{ name: 'Genre', internalKey: 'tags', items: Object.keys(DEFAULT_INSTALLED_FILTER_CONFIG.tags).sort() },
	{ name: 'Age Rating', internalKey: 'ratingtags', items: ['Everyone', 'Questionable', 'Mature'] },
	{
		name: 'Resolution',
		internalKey: 'resolutiontags',
		items: ["1280 x 720", "1366 x 768", "1920 x 1080", "2560 x 1440", "3840 x 2160", "Standard Definition", "Dynamic resolution", "Other resolution"],
		groups: [
			{ name: 'Ultrawide', items: ["Ultrawide 2560 x 1080", "Ultrawide 3440 x 1440", "Ultrawide Standard Definition"] },
			{ name: 'Dual Monitor', items: ["Dual 3840 x 1080", "Dual 5120 x 1440", "Dual 7680 x 2160", "Dual Standard Definition"] },
			{ name: 'Triple Monitor', items: ["Triple 11520 x 2160", "Triple 4096 x 768", "Triple 5760 x 1080", "Triple 7680 x 1440", "Triple Standard Definition"] },
			{ name: 'Portrait Monitor / Phone', items: ["Portrait 1080 x 1920", "Portrait 1440 x 2560", "Portrait 2160 x 3840", "Portrait 720 x 1280", "Portrait Standard Definition"] }
		]
	},
	{ name: 'Category', internalKey: 'categorytags', items: ["Preset", "Wallpaper"] },
	{ name: 'Source', internalKey: 'sourcetags', items: ["Local", "Official", "Workshop"] },
	{ name: 'Miscellaneous', internalKey: 'utilitytags', items: [] }
];

export const buildFilterCategories = (_?: FilterConfig): FilterCategory[] => FILTER_CATEGORIES;
