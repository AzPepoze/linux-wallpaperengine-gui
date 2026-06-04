import type { WallpaperData, FilterConfig } from '@shared/types';

export function filterWallpapers(
	wallpapers: Record<string, WallpaperData>,
	filters: FilterConfig | null,
	downloadProgress: Record<string, any> = {}
): Record<string, WallpaperData> {
	if (!filters) return wallpapers;

	// Extract active tags by category
	const activeTags: Record<string, string[]> = {};
	const categories = [
		'tags',
		'typetags',
		'ratingtags',
		'resolutiontags',
		'categorytags',
		'sourcetags',
		'utilitytags'
	];

	let hasAnyFilter = false;
	categories.forEach((cat) => {
		const catKey = cat as keyof FilterConfig;
		const tags = (filters[catKey] || {}) as Record<string, boolean>;
		const active = Object.entries(tags)
			.filter(([_, val]) => val)
			.map(([name, _]) => name.toLowerCase());

		if (active.length > 0) {
			activeTags[cat] = active;
			hasAnyFilter = true;
		}
	});

	if (!hasAnyFilter) return wallpapers;

	const filtered: Record<string, WallpaperData> = {};

	Object.entries(wallpapers).forEach(([folderName, data]) => {
		const projectData = data.projectData;
		const wpTags = (projectData?.tags || []).map((t) =>
			t.toLowerCase()
		);
		const wpType = projectData?.type?.toLowerCase();
		let wpRating = projectData?.contentrating?.toLowerCase() || '';
		const wpApproved = projectData?.approved;

		// If rating is missing, default to everyone (common for local items)
		// Also check if 'everyone' or 'age-everyone' is in tags as fallback
		if (!wpRating) {
			if (
				wpTags.includes('everyone') ||
				wpTags.includes('age-everyone')
			) {
				wpRating = 'everyone';
			} else {
				wpRating = 'everyone'; // Safe default
			}
		}

		// Logic: Categories are ANDed, tags within are ORed
		let matches = true;
		for (const [cat, tags] of Object.entries(activeTags)) {
			if (cat === 'typetags') {
				if (!tags.includes(wpType || '')) {
					matches = false;
					break;
				}
			} else if (cat === 'ratingtags') {
				// Check contentrating field explicitly for age ratings
				if (!tags.includes(wpRating || '')) {
					matches = false;
					break;
				}
			} else if (cat === 'sourcetags') {
				// Local wallpapers are either 'workshop' (if they have id) or 'local'
				const isWorkshop =
					!!projectData?.workshopid ||
					/^\d+$/.test(folderName);
				const canShowWorkshop = tags.includes('workshop');
				const canShowLocal = tags.includes('local');

				if (isWorkshop && canShowWorkshop) continue;
				if (!isWorkshop && canShowLocal) continue;

				matches = false;
				break;
			} else if (cat === 'utilitytags') {
				// Approved is a special utility tag
				const needsApproved = tags.includes('approved');
				if (needsApproved && !wpApproved) {
					matches = false;
					break;
				}

				// Other utility tags check current tags
				const otherUtilityTags = tags.filter(
					(t) => t !== 'approved'
				);
				if (otherUtilityTags.length > 0) {
					const hasTagInCat = otherUtilityTags.some((t) =>
						wpTags.includes(t)
					);
					if (!hasTagInCat) {
						matches = false;
						break;
					}
				}
			} else if (cat === 'categorytags') {
				// Local items are almost always 'wallpaper'
				const isWallpaperFilter = tags.includes('wallpaper');
				if (isWallpaperFilter) {
					continue;
				} else {
					// Only fail if user has specific category filters and none match
					const hasTagInCat = tags.some((t) =>
						wpTags.includes(t)
					);
					if (!hasTagInCat) {
						matches = false;
						break;
					}
				}
			} else if (cat === 'resolutiontags') {
				// Skip resolution filtering for local items for now
				continue;
			} else {
				// Check if wallpaper has any of the tags in this category
				const hasTagInCat = tags.some((t) =>
					wpTags.includes(t)
				);
				if (!hasTagInCat) {
					matches = false;
					break;
				}
			}
		}

		if (matches) {
			filtered[folderName] = data;
		}
	});

	// Always include downloading items, even if they don't match filters
	Object.entries(wallpapers).forEach(([folderName, data]) => {
		if (downloadProgress[folderName] && !filtered[folderName]) {
			filtered[folderName] = data;
		}
	});

	return filtered;
}
