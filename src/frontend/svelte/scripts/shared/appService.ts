import { logger } from '@/scripts/shared/logger';
import { initDisplay, refreshScreens } from '@/scripts/home/display';
import { 
	loading, 
	error, 
	setWallpaperData,
	selectedFolderName,
	activeFolderName
} from '@/scripts/home/wallpaperStore';
import { get } from 'svelte/store';
import { selectedScreen, screens } from '@/scripts/home/display';

export async function initializeApp() {
	loading.set(true);
	
	initDisplay();
	logger.log('Application initialization started');

	// Backend handles executable validation
	if (window.electronAPI.validateExecutable) {
		await window.electronAPI.validateExecutable();
	}

	try {
		const result = await window.electronAPI.loadWallpapers();
		setWallpaperData(result);
		error.set(result.error || null);
		
		if (result.selectedWallpaper) {
			selectedFolderName.set(result.selectedWallpaper.folderName);
			activeFolderName.set(result.selectedWallpaper.folderName);
		}
		
		await refreshScreens();
		
		// Set initial selection if not set
		const $selectedFolderName = get(selectedFolderName);
		if (!$selectedFolderName) {
			const $selectedScreen = get(selectedScreen);
			const $screens = get(screens);
			
			if ($selectedScreen && $screens[$selectedScreen]) {
				const folderName = $screens[$selectedScreen];
				activeFolderName.set(folderName);
				selectedFolderName.set(folderName);
			}
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		error.set(`Initialization failed: ${msg}`);
		logger.error('App init error:', err);
	} finally {
		loading.set(false);
	}
}

export function setupGlobalListeners() {
	// Listen for toasts from main process
	window.electronAPI.on(
		'show-toast',
		(data: {
			message: string;
			type: 'success' | 'error' | 'warn' | 'info';
			duration?: number;
		}) => {
			import('@/scripts/settings/settings').then(({ showToast }) => {
				showToast(data.message, data.type, data.duration);
			});
		}
	);

	// Handle external link clicks
	const handleLinkClick = (e: MouseEvent) => {
		const target = (e.target as HTMLElement).closest('a');
		if (target && target.href) {
			const url = target.href;
			if (
				url.startsWith('http') ||
				url.startsWith('mailto:') ||
				url.startsWith('tel:')
			) {
				e.preventDefault();
				e.stopPropagation();
				setTimeout(() => {
					window.electronAPI.openExternal(url);
				}, 100);
			}
		}
	};

	document.addEventListener('click', handleLinkClick, true);
	return () => document.removeEventListener('click', handleLinkClick, true);
}
