import { writable, derived } from 'svelte/store';
import type { WallpaperData, Wallpaper } from '@shared/types';

export const wallpapers = writable<Record<string, WallpaperData>>({});
export const loading = writable<boolean>(true);
export const error = writable<string | null>(null);
export const workshopPathValid = writable<boolean>(true);
export const wallpaperEnginePathValid = writable<boolean>(true);

export const selectedFolderName = writable<string | null>(null);
export const activeFolderName = writable<string | null>(null);

export const selectedWallpaper = derived(
	[wallpapers, selectedFolderName],
	([$wallpapers, $selectedFolderName]) => {
		if (!$selectedFolderName || !$wallpapers[$selectedFolderName]) return null;
		return {
			...$wallpapers[$selectedFolderName],
			folderName: $selectedFolderName
		} as Wallpaper;
	}
);

export const activeWallpaper = derived(
	[wallpapers, activeFolderName],
	([$wallpapers, $activeFolderName]) => {
		if (!$activeFolderName || !$wallpapers[$activeFolderName]) return null;
		return {
			...$wallpapers[$activeFolderName],
			folderName: $activeFolderName
		} as Wallpaper;
	}
);

// Helper to update wallpapers from backend data
export function setWallpaperData(data: any) {
	if (typeof data === 'object' && data !== null && 'wallpapers' in data) {
		wallpapers.set(data.wallpapers);
		workshopPathValid.set(data.workshopPathValid);
		wallpaperEnginePathValid.set(data.wallpaperEnginePathValid);
	} else {
		wallpapers.set(data);
	}
}
