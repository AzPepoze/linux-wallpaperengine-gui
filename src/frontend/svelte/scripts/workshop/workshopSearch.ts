import type { FilterConfig } from '@shared/filterConstants';
import type { FilterCategory } from '@shared/filterConstants';

export function getSearchParameters(
	workshopFilters: FilterConfig | null,
	filterCategories: FilterCategory[]
): {
	required: string[];
	excluded: string[];
} {
	if (!workshopFilters) return { required: [], excluded: [] };

	const required: string[] = [];
	const excluded: string[] = [];

	const categoryMap: Record<string, string[]> = {};
	filterCategories.forEach((cat) => {
		let allItems = [...cat.items];
		if (cat.groups) {
			cat.groups.forEach((group) => {
				allItems.push(...group.items);
			});
		}
		categoryMap[cat.internalKey as string] = allItems;
	});

	const categoryKeys = [
		'tags',
		'typetags',
		'ratingtags',
		'resolutiontags',
		'categorytags',
		'sourcetags',
		'utilitytags'
	];

	categoryKeys.forEach((catKey) => {
		const filterTags = workshopFilters[
			catKey as keyof FilterConfig
		] as Record<string, boolean>;

		const allPossibleTags = categoryMap[catKey] || [];
		if (allPossibleTags.length === 0) return;

		const activeTags = Object.entries(filterTags)
			.filter(([_, active]) => active)
			.map(([tagName, _]) => tagName);

		if (activeTags.length === allPossibleTags.length) {
			return;
		}

		if (catKey === 'ratingtags' || catKey === 'typetags') {
			allPossibleTags.forEach((tag) => {
				if (!filterTags[tag]) {
					excluded.push(tag);
				}
			});
		} else {
			activeTags.forEach((tag) => required.push(tag));
		}
	});

	return { required, excluded };
}
