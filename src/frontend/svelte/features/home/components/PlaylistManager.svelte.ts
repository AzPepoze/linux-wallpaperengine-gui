import { showToast } from '@/core/toastStore';
import { WALLPAPER_ENGINE_APP_ID } from '@shared/constants';
import type { Playlist, WallpaperData } from '@shared/types';

export function getPlaylistOptions(playlists: Playlist[]) {
	return [
		{ value: '', label: 'None' },
		{ value: 'Random All', label: 'Random All (Dynamic)' },
		...playlists.map((p) => ({
			value: p.name,
			label: `${p.name} (${p.items.length} items)`
		}))
	];
}

export async function fetchPlaylists(): Promise<Playlist[]> {
	try {
		const result = await window.electronAPI.getPlaylists();
		if (result.success && result.playlists) {
			return result.playlists;
		}
	} catch (err) {
		console.error('Failed to load playlists:', err);
	}
	return [];
}

export async function startPlaylist(
	playlistName: string,
	interval: number,
	cloneMode: boolean,
	selectedScreen: string | null
) {
	const screenName = cloneMode ? 'Global' : selectedScreen || '';
	if (playlistName === 'Random All') {
		await window.electronAPI.startPlaylist('Random All', interval, screenName);
		showToast(
			`Started dynamic random rotation on ${cloneMode ? 'all displays' : selectedScreen || 'display'}`,
			'success'
		);
	} else {
		await window.electronAPI.startPlaylist(playlistName, interval, screenName);
		showToast(
			`Started playlist on ${cloneMode ? 'all displays' : selectedScreen || 'display'}: ${playlistName}`,
			'success'
		);
	}
}

export async function stopPlaylist(cloneMode: boolean, selectedScreen: string | null) {
	const screenName = cloneMode ? 'Global' : selectedScreen || '';
	await window.electronAPI.stopPlaylist(screenName);
}

export async function createPlaylist(name: string): Promise<boolean> {
	try {
		await window.electronAPI.createPlaylist(name);
		showToast('Playlist created', 'success');
		return true;
	} catch (e) {
		showToast('Failed to create playlist', 'error');
		return false;
	}
}

export async function renamePlaylist(oldName: string, newName: string): Promise<boolean> {
	try {
		await window.electronAPI.renamePlaylist(oldName, newName);
		showToast('Playlist renamed', 'success');
		return true;
	} catch (e) {
		showToast('Failed to rename playlist', 'error');
		return false;
	}
}

export async function deletePlaylist(name: string): Promise<boolean> {
	try {
		await window.electronAPI.deletePlaylist(name);
		showToast('Playlist deleted', 'success');
		return true;
	} catch (e) {
		showToast('Failed to delete playlist', 'error');
		return false;
	}
}

export async function updatePlaylistInterval(
	playlistName: string,
	interval: number,
	cloneMode: boolean,
	selectedScreen: string | null
) {
	const screenName = cloneMode ? 'Global' : selectedScreen || '';
	try {
		await window.electronAPI.updatePlaylistInterval(playlistName, interval, screenName);
	} catch (err) {
		console.warn('Could not update playlist interval:', err);
	}
}

export async function removePlaylistItem(
	playlistName: string,
	items: string[],
	index: number
): Promise<string[] | null> {
	const newItems = [...items];
	newItems.splice(index, 1);
	try {
		await window.electronAPI.updatePlaylistWallpapers(playlistName, newItems);
		return newItems;
	} catch (e) {
		showToast('Failed to remove item', 'error');
		return null;
	}
}

export function parseWallpaperIdFromPath(itemPath: string): string | null {
	const regex = new RegExp(`${WALLPAPER_ENGINE_APP_ID}[\\/\\\\](\\d+)[\\/\\\\]`);
	const match = itemPath.match(regex);
	return match && match[1] ? match[1] : null;
}

export async function toggleWallpaperInPlaylist(
	playlist: Playlist,
	folderName: string,
	wpInfo: WallpaperData
): Promise<string[] | null> {
	if (!wpInfo || !wpInfo.projectData) return null;

	try {
		const basePath = await window.electronAPI.getWallpaperBasePath();
		if (!basePath) {
			showToast('Could not determine wallpaper directory', 'error');
			return null;
		}

		const normalizedBase = basePath
			.replace(/[\/]+$/, '')
			.replace(/\\/g, '/');
		const rawFile = wpInfo.projectData.file;
		const wallpaperFile = rawFile === 'scene.json' ? 'scene.pkg' : rawFile;
		const itemPath = `Z:${normalizedBase}/${folderName}/${wallpaperFile}`;

		let newItems: string[];
		const alreadyIn = playlist.items.some((p) => p.includes(`/${folderName}/`));
		if (!alreadyIn) {
			newItems = [...playlist.items, itemPath];
			showToast(`Added to ${playlist.name}`, 'success');
		} else {
			newItems = playlist.items.filter((path) => !path.includes(`/${folderName}/`));
			showToast(`Removed from ${playlist.name}`, 'info');
		}

		await window.electronAPI.updatePlaylistWallpapers(playlist.name, newItems);
		return newItems;
	} catch (err) {
		console.error('Failed to add wallpaper:', err);
		showToast('Failed to update playlist', 'error');
		return null;
	}
}
