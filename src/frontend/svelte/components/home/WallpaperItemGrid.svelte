<script lang="ts">
	import { fly } from 'svelte/transition';
	import WallpaperCard from '@/components/shared/wallpaper/WallpaperCard.svelte';
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';

	import VirtualGrid from '@/components/shared/ui/VirtualGrid.svelte';

	export let wallpapers: [string, WallpaperData][] = [];
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
	export let container: HTMLElement | null = null;
</script>

<div
	class="wallpaper-grid-wrapper"
	in:fly={{ x: -20, delay: 200, duration: 200 }}
	out:fly={{ x: -20, duration: 200 }}
>
	<VirtualGrid
		items={wallpapers}
		itemWidth={170}
		itemHeight={170}
		gap={5}
		{container}
	>
		{#snippet children({
			visibleItems,
			startIndex
		}: {
			visibleItems: [string, WallpaperData][];
			startIndex: number;
		})}
			{#each visibleItems as [folderName, wallpaper], i (folderName)}
				<WallpaperCard
					{folderName}
					{wallpaper}
					{selectedWallpaper}
					{activePlaylist}
					{onSelect}
					{isWorkshop}
					index={startIndex + i}
					viewMode="grid"
				/>
			{/each}
		{/snippet}
	</VirtualGrid>
</div>

<style lang="scss">
	.wallpaper-grid-wrapper {
		width: 100%;
		flex: 1;
	}
</style>
