<script lang="ts">
	import { fly } from 'svelte/transition';
	import WallpaperCard from '@/components/shared/wallpaper/WallpaperCard.svelte';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '@shared/types';

	import VirtualList from '@/components/shared/ui/VirtualList.svelte';

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
	class="wallpaper-list-wrapper"
	in:fly={{ x: 20, delay: 200, duration: 200 }}
	out:fly={{ x: 20, duration: 200 }}
>
	<VirtualList
		items={wallpapers}
		itemHeight={124}
		gap={10}
		{container}
	>
		{#snippet children({ visibleItems }: { visibleItems: [string, WallpaperData][] })}
			{#each visibleItems as [folderName, wallpaper] (folderName)}
				<WallpaperCard
					{folderName}
					{wallpaper}
					{selectedWallpaper}
					{activePlaylist}
					{onSelect}
					{isWorkshop}
					viewMode="list"
				/>
			{/each}
		{/snippet}
	</VirtualList>
</div>

<style lang="scss">
	.wallpaper-list-wrapper {
		width: 100%;
		flex: 1;
	}
</style>
