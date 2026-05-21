<script lang="ts">
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';
	import {
		isWallpaperFolderExist,
		getDownloadState,
		downloadStatus
	} from '@/scripts/workshop/workshop';
	import { onMount } from 'svelte';
	import WallpaperCardGrid from './WallpaperCardGrid.svelte';
	import WallpaperCardList from './WallpaperCardList.svelte';

	export let folderName: string;
	export let wallpaper: WallpaperData;
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
	export let index: number = 0;
	export let viewMode: 'grid' | 'list' = 'grid';

	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;
	$: isWorkshopItem = !!wallpaper.projectData?.isWorkshop;

	const downloadState = getDownloadState(folderName);
	$: ({ isSubscribed, isDownloaded, isDownloading, percent } = $downloadState);

	onMount(() => {
		if (
			(isWorkshop || isWorkshopItem) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}
	});

	function handleSelect() {
		onSelect(folderName, wallpaper);
	}
</script>

{#if viewMode === 'grid'}
	<WallpaperCardGrid
		{folderName}
		{wallpaper}
		{selected}
		{inPlaylist}
		{isWorkshopItem}
		{isSubscribed}
		{isDownloaded}
		{isDownloading}
		{percent}
		{isWorkshop}
		{index}
		{handleSelect}
	/>
{:else}
	<WallpaperCardList
		{folderName}
		{wallpaper}
		{selected}
		{inPlaylist}
		{isWorkshopItem}
		{isSubscribed}
		{isDownloaded}
		{isDownloading}
		{percent}
		{isWorkshop}
		{handleSelect}
	/>
{/if}