<script lang="ts">
	import SidebarShell from '@/ui/layout/SidebarShell.svelte';
	import WorkshopActions from './sidebar/WorkshopActions.svelte';
	import WorkshopItemContent from './sidebar/WorkshopItemContent.svelte';
	import LocalWallpaperContent from './sidebar/LocalWallpaperContent.svelte';
	import ApplyButton from './sidebar/ApplyButton.svelte';
	import type { Wallpaper } from '@shared/types';
	import { getWallpaperFolder, isWorkshopWallpaper } from '@/core/utils/workshopHelper';
	import { isWallpaperFolderExist } from '@/features/workshop/scripts/workshop';
	import { settingsStore, type SettingsState } from '@/features/settings/scripts/settings';
	import {
		calculateSidebarTheme,
		DEFAULT_THEME,
		type SidebarTheme
	} from '@/features/home/scripts/sidebarTheme';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};
	export let canSubscribe: boolean = true;

	// Only changes once the new wallpaper's data is loaded, so nothing shows half-ready
	let shownWallpaper: Wallpaper | null = null;
	let theme: SidebarTheme = DEFAULT_THEME;
	let fileSize: number | null = null;
	let isInstalled = false;
	let requestId = 0;

	$: canApply =
		!shownWallpaper ||
		!isWorkshopWallpaper(shownWallpaper.folderName, shownWallpaper.projectData) ||
		isInstalled;

	$: showWallpaper(selectedWallpaper, $settingsStore);

	async function showWallpaper(next: Wallpaper | null, settings: SettingsState | null) {
		const id = ++requestId;
		if (!next) {
			shownWallpaper = null;
			return;
		}

		const data = await loadWallpaperData(next, settings);
		if (id !== requestId) return;

		theme = data.theme;
		fileSize = data.fileSize;
		isInstalled = data.isInstalled;
		shownWallpaper = next;
	}

	async function loadWallpaperData(wallpaper: Wallpaper, settings: SettingsState | null) {
		const [nextTheme, nextFileSize, nextInstalled] = await Promise.all([
			calculateSidebarTheme(wallpaper, settings),
			resolveFileSize(wallpaper),
			isWallpaperFolderExist(wallpaper.folderName, true),
			preloadImage(wallpaper.previewPath)
		]);
		return { theme: nextTheme, fileSize: nextFileSize, isInstalled: nextInstalled };
	}

	async function resolveFileSize(wallpaper: Wallpaper): Promise<number | null> {
		try {
			if (!wallpaper.projectData?.isWorkshop) {
				const basePath = await window.electronAPI.getWallpaperBasePath();
				if (!basePath) return null;
				return await window.electronAPI.getDirectorySize(
					getWallpaperFolder(wallpaper.folderName, wallpaper.folderPath, basePath)
				);
			}
			const info = await window.electronAPI.getWorkshopItemInstallInfo(wallpaper.folderName);
			return info?.sizeOnDisk ? Number(info.sizeOnDisk) : (wallpaper as any).fileSize || null;
		} catch (e) {
			return null;
		}
	}

	// Decodes the preview first, so the browser paints it on the first frame
	async function preloadImage(src: string | undefined) {
		if (!src) return;
		const image = new Image();
		image.src = src;
		await image.decode().catch(() => {});
	}
</script>

<SidebarShell selectedWallpaper={shownWallpaper} {theme} {onClose}>
	<div slot="actions">
		{#if shownWallpaper}
			<WorkshopActions wallpaper={shownWallpaper} {canSubscribe} />
		{/if}
	</div>

	{#if shownWallpaper}
		{#if shownWallpaper.projectData?.isWorkshop}
			<WorkshopItemContent wallpaper={shownWallpaper} {fileSize} />
		{:else}
			<LocalWallpaperContent wallpaper={shownWallpaper} {fileSize} />
		{/if}
	{/if}
	<div slot="footer">
		{#if shownWallpaper}
			<ApplyButton folderName={shownWallpaper.folderName} disabled={!canApply} />
		{/if}
	</div>
</SidebarShell>
