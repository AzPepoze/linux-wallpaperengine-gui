<script lang="ts">
	import SidebarShell from '@/ui/layout/SidebarShell.svelte';
	import WorkshopActions from './sidebar/WorkshopActions.svelte';
	import WorkshopItemContent from './sidebar/WorkshopItemContent.svelte';
	import LocalWallpaperContent from './sidebar/LocalWallpaperContent.svelte';
	import ApplyButton from './sidebar/ApplyButton.svelte';
	import type { Wallpaper } from '@shared/types';
	import { getWallpaperFolder, isWorkshopWallpaper } from '@/core/utils/workshopHelper';
	import { downloadStatus } from '@/features/workshop/scripts/workshop';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};
	export let canSubscribe: boolean = true;

	$: canApply =
		!!selectedWallpaper &&
		(!isWorkshopWallpaper(selectedWallpaper.folderName, selectedWallpaper.projectData) ||
			!!$downloadStatus[selectedWallpaper.folderName]);

	let lastWallpaperId: string | null = null;
	let calculatedFileSize: number | null = null;

	async function resolveFileSize(wallpaper: Wallpaper) {
		try {
			if (!wallpaper.projectData?.isWorkshop) {
				const basePath = await window.electronAPI.getWallpaperBasePath();
				if (basePath) {
					calculatedFileSize = await window.electronAPI.getDirectorySize(
						getWallpaperFolder(wallpaper.folderName, wallpaper.folderPath, basePath)
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
			<WorkshopActions wallpaper={selectedWallpaper} {canSubscribe} />
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
	<div slot="footer">
		{#if canApply && selectedWallpaper}
			<ApplyButton folderName={selectedWallpaper.folderName} />
		{/if}
	</div>
</SidebarShell>
