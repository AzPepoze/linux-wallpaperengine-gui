<script lang="ts">
	import { fly } from 'svelte/transition';
	import WallpaperListItem from './WallpaperListItem.svelte';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';

	export let wallpapers: Record<string, WallpaperData> = {};
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
</script>

<div
	class="wallpaper-list"
	in:fly={{ x: 20, delay: 200, duration: 200 }}
	out:fly={{ x: 20, duration: 200 }}
>
	{#each Object.entries(wallpapers) as [folderName, wallpaper]}
		<WallpaperListItem
			{folderName}
			{wallpaper}
			{selectedWallpaper}
			{activePlaylist}
			{onSelect}
			{isWorkshop}
		/>
	{/each}
</div>

<style lang="scss">
	.wallpaper-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px;
		box-sizing: border-box;
		width: 100%;
	}
</style>
