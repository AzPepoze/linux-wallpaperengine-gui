import {
	formatWorkshopItem,
	isValidWorkshopItem,
	type PublishedFileDetails,
	type WorkshopItem
} from '@/utils/workshopHelper';
import type { FilterConfig } from '@shared/types';
import {
	buildFilterCategories,
	DEFAULT_WORKSHOP_FILTER_CONFIG,
	type FilterCategory
} from '@shared/filterConstants';
import { getSearchParameters } from '@/scripts/workshop/workshopSearch';

export async function checkSteamStatus(): Promise<boolean> {
	try {
		return await window.electronAPI.isSteamRunning();
	} catch (err) {
		console.error('Failed to check Steam status:', err);
		return false;
	}
}

export function launchSteam(): void {
	window.electronAPI.openExternal('steam://open/main');
}

export async function loadFilters(): Promise<{
	filters: FilterConfig;
	categories: FilterCategory[];
} | null> {
	try {
		const result = await window.electronAPI.getWorkshopFilters();
		if (result.success) {
			const filters = {
				...DEFAULT_WORKSHOP_FILTER_CONFIG,
				...result.filters
			};
			const categories = buildFilterCategories(filters);
			return { filters, categories };
		}
	} catch (err) {
		console.error('Failed to load filters:', err);
	}
	return null;
}

export async function saveFilters(newConfig: FilterConfig): Promise<boolean> {
	try {
		const result = await window.electronAPI.saveWorkshopFilters(newConfig);
		return !!result.success;
	} catch (err) {
		console.error('Failed to save filters:', err);
		return false;
	}
}

interface QueryParams {
	searchText: string;
	filters: FilterConfig;
	categories: FilterCategory[];
	page: number;
	sortOrder: string;
	itemType: string;
	pageSize: string;
	infiniteScroll: boolean;
}

interface QueryResult {
	items: WorkshopItem[];
	total: number;
	steamOffline: boolean;
}

export async function performWorkshopQuery(params: QueryParams): Promise<QueryResult> {
	const { required, excluded } = getSearchParameters(
		params.filters,
		params.categories
	);

	const limit = params.infiniteScroll ? 50 : parseInt(params.pageSize);

	const result = await window.electronAPI.queryWorkshopFiles({
		search_text: params.searchText,
		requiredtags: required.length > 0 ? required : undefined,
		excludedtags: excluded.length > 0 ? excluded : undefined,
		page: params.page,
		query_type: parseInt(params.sortOrder),
		item_type: parseInt(params.itemType),
		numperpage: limit
	});

	if (result?.error) {
		throw new Error(result.error);
	}

	const validItems = (result?.items || [])
		.filter(isValidWorkshopItem)
		.map((details: PublishedFileDetails) => formatWorkshopItem(details));

	const steamOffline = !!(
		result?.error?.includes('Steamworks client not initialized') ||
		result?.error?.includes('network connection to steam')
	);

	return {
		items: validItems,
		total: result?.total || 0,
		steamOffline
	};
}
