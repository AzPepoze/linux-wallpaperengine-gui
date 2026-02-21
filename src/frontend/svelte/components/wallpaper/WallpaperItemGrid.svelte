<script lang="ts">
	import { fly } from 'svelte/transition';
	import WallpaperItemComponent from './WallpaperItem.svelte';
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
	class="wallpaper-grid"
	in:fly={{ x: -20, delay: 200, duration: 200 }}
	out:fly={{ x: -20, duration: 200 }}
>
	{#each Object.entries(wallpapers) as [folderName, wallpaper], index (folderName)}
		<WallpaperItemComponent
			{folderName}
			{wallpaper}
			{selectedWallpaper}
			{activePlaylist}
			{onSelect}
			{isWorkshop}
			{index}
		/>
	{/each}
</div>

<style lang="scss">
	.wallpaper-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		padding: 20px;
		justify-content: center;
	}
</style>
