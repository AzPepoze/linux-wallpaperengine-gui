import { writable } from 'svelte/store';
import { showToast } from '@/core/toastStore';
import { logger } from '@/core/logger';

export const previewingWallpaperId = writable<string | null>(null);

export async function startWallpaperPreview(wallpaperId: string, geometry: string = '0x0x1280x720') {
	try {
		showToast('Opening live preview window...', 'info');
		const res = await window.electronAPI.startPreview(wallpaperId, geometry);
		if (res.success) {
			previewingWallpaperId.set(wallpaperId);
		} else {
			showToast(`Failed to start preview: ${res.error}`, 'error');
		}
	} catch (err: any) {
		logger.error('Failed to start wallpaper preview:', err);
		showToast(`Failed to start preview: ${err.message || err}`, 'error');
	}
}

export async function stopWallpaperPreview() {
	try {
		await window.electronAPI.stopPreview();
		previewingWallpaperId.set(null);
		showToast('Live preview stopped', 'info');
	} catch (err: any) {
		logger.error('Failed to stop wallpaper preview:', err);
	}
}
