import { logger } from '@/scripts/shared/logger';
import type { FilterConfig, Playlist, WallpaperData } from '@shared/types';
import { DEFAULT_INSTALLED_FILTER_CONFIG } from '@shared/filterConstants';

export async function checkSteamStatus(): Promise<boolean> {
	try {
		return await window.electronAPI.isSteamRunning();
	} catch (err) {
		console.error('Failed to check Steam status:', err);
		return false;
	}
}

export async function loadInstalledFilters(): Promise<FilterConfig> {
	try {
		const result = await window.electronAPI.getInstalledFilters();
		if (result.success) {
			return {
				...DEFAULT_INSTALLED_FILTER_CONFIG,
				...result.filters
			};
		}
	} catch (err) {
		console.error('Failed to load filters:', err);
	}
	return { ...DEFAULT_INSTALLED_FILTER_CONFIG };
}

export async function saveInstalledFilters(newConfig: FilterConfig): Promise<boolean> {
	try {
		const result = await window.electronAPI.saveInstalledFilters(newConfig);
		return !!result.success;
	} catch (err) {
		console.error('Failed to save filters:', err);
		logger.error('Failed to save home filters:', err);
		return false;
	}
}

interface PlaylistsLoadResult {
	playlists: Playlist[];
	weConfigError: boolean;
}

export async function fetchPlaylists(): Promise<PlaylistsLoadResult> {
	try {
		const result = await window.electronAPI.getPlaylists();
		if (result.success && result.playlists) {
			return {
				playlists: result.playlists,
				weConfigError: false
			};
		} else if (
			result.error &&
			result.error.includes('Wallpaper Engine configuration not found')
		) {
			return {
				playlists: [],
				weConfigError: true
			};
		}
	} catch (err) {
		console.error('Failed to load playlists:', err);
	}
	return {
		playlists: [],
		weConfigError: false
	};
}

interface WallpapersLoadResult {
	wallpapers: Record<string, WallpaperData>;
	workshopPathValid: boolean;
	wallpaperEnginePathValid: boolean;
}

export async function fetchWallpapers(): Promise<WallpapersLoadResult> {
	const result = await window.electronAPI.loadWallpapers();
	logger.log(`[DEBUG] refreshWallpapers loaded ${Object.keys(result.wallpapers).length} wallpapers`);
	return {
		wallpapers: result.wallpapers,
		workshopPathValid: result.workshopPathValid,
		wallpaperEnginePathValid: result.wallpaperEnginePathValid
	};
}

export function getCombinedWallpapers(
	wallpapers: Record<string, WallpaperData>,
	subscribedIdsSet: Set<string>,
	downloadingMetadataMap: Record<string, WallpaperData>,
	steamRunning: boolean
): Record<string, WallpaperData> {
	const combined: Record<string, WallpaperData> = { ...wallpapers };
	const subscribedList = Array.from(subscribedIdsSet);

	subscribedList.forEach((fileId) => {
		if (!combined[fileId] && downloadingMetadataMap[fileId]) {
			combined[fileId] = downloadingMetadataMap[fileId];
		}
	});

	const result: Record<string, WallpaperData> = {};
	Object.entries(combined).forEach(([id, data]) => {
		const isWorkshop =
			!!data.projectData?.workshopid ||
			!!data.projectData?.isWorkshop ||
			/^\d+$/.test(id);

		if (isWorkshop) {
			if (!steamRunning || subscribedIdsSet.has(id)) {
				result[id] = data;
			}
		} else {
			result[id] = data;
		}
	});

	return result;
}
