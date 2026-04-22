<script lang="ts">
	import SidebarShell from '@/components/shared/layout/SidebarShell.svelte';
	import WorkshopActions from './sidebar/WorkshopActions.svelte';
	import WorkshopItemContent from './sidebar/WorkshopItemContent.svelte';
	import LocalWallpaperContent from './sidebar/LocalWallpaperContent.svelte';
	import type { Wallpaper } from '@shared/types';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};

	let lastWallpaperId: string | null = null;
	let calculatedFileSize: number | null = null;

	async function resolveFileSize(wallpaper: Wallpaper) {
		try {
			if (!wallpaper.projectData?.isWorkshop) {
				const basePath = await window.electronAPI.getWallpaperBasePath();
				if (basePath) {
					calculatedFileSize = await window.electronAPI.getDirectorySize(
						`${basePath}/${wallpaper.folderName}`
					);
				}
			} else {
				const info = await window.electronAPI.getWorkshopItemInstallInfo(
					wallpaper.folderName
				);
				calculatedFileSize = info?.sizeOnDisk ? Number(info.sizeOnDisk) : (wallpaper as any).fileSize || null;
			}
		} catch (e) {
			calculatedFileSize = null;
		}
	}

	$: if (selectedWallpaper && selectedWallpaper.folderName !== lastWallpaperId) {
		lastWallpaperId = selectedWallpaper.folderName;
		calculatedFileSize = null;
		resolveFileSize(selectedWallpaper);
	}
</script>

<SidebarShell {selectedWallpaper} {onClose}>
	<div slot="actions">
		{#if selectedWallpaper}
			<WorkshopActions wallpaper={selectedWallpaper} />
		{/if}
	</div>

	{#if selectedWallpaper}
		{#if selectedWallpaper.projectData?.isWorkshop}
			<WorkshopItemContent
				wallpaper={selectedWallpaper}
				fileSize={calculatedFileSize}
			/>
		{:else}
			<LocalWallpaperContent
				wallpaper={selectedWallpaper}
				fileSize={calculatedFileSize}
			/>
		{/if}
	{/if}
</SidebarShell>
