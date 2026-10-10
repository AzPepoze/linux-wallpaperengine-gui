import { get } from 'svelte/store';
import { showToast } from '@/core/toastStore';
import { logger } from '@/core/logger';
import { screens, selectedScreen, cloneMode, spanMode } from '@/features/home/scripts/display';
import { activeFolderName, selectedFolderName } from '@/features/home/scripts/wallpaperStore';

export async function applyWallpaper(folderName: string, targetScreen?: string) {
	try {
		let screen = targetScreen || get(selectedScreen);
		let allScreens = Object.keys(get(screens));

		if (!screen && allScreens.length > 0) {
			screen = allScreens[0];
			selectedScreen.set(screen);
		}

		if (!screen) {
			const resScreens = await window.electronAPI.getScreens();
			if (resScreens?.screens && resScreens.screens.length > 0) {
				screen = resScreens.screens[0];
				selectedScreen.set(screen);
				allScreens = resScreens.screens;
			}
		}

		if (screen) {
			const isClone = get(cloneMode);
			const isSpan = get(spanMode);
			let appliedTo = targetScreen || screen;
			if ((isClone || isSpan) && !targetScreen) {
				appliedTo = 'all displays';
				for (const s of allScreens) {
					await window.electronAPI.setWallpaper(s, folderName);
				}
				screens.update((s) => {
					const updated = { ...s };
					allScreens.forEach((scr) => (updated[scr] = folderName));
					return updated;
				});
			} else {
				await window.electronAPI.setWallpaper(screen, folderName);
				screens.update((s) => ({
					...s,
					[screen as string]: folderName
				}));
			}
			activeFolderName.set(folderName);
			selectedFolderName.set(folderName);
			showToast(`Applied wallpaper to ${appliedTo}`, 'info');
		} else {
			showToast('No active display found', 'error');
		}
	} catch (err) {
		logger.error('Failed to apply wallpaper:', err);
		showToast('Failed to apply wallpaper', 'error');
	}
}
