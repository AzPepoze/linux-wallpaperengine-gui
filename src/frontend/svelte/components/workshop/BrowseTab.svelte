<script lang="ts">
	import type { WorkshopItem } from '@/utils/workshopHelper';
	import type { WallpaperData, Wallpaper } from '@shared/types';
	import { fade, fly } from 'svelte/transition';
	import { convertWorkshopItemsToWallpaperPairs } from '@/utils/browse';
	import { settingsStore } from '@/scripts/settings/settings';
	import BrowsePagination from './BrowsePagination.svelte';
	import Sidebar from '@/components/home/Sidebar.svelte';
	import WallpaperItemGrid from '@/components/home/WallpaperItemGrid.svelte';
	import WallpaperItemList from '@/components/home/WallpaperItemList.svelte';

	export let browseItems: WorkshopItem[] = [];
	export let browseLoading: boolean = false;
	export let totalItems: number = 0;
	export let viewMode: 'grid' | 'list' = 'grid';
	export let onLoadBrowseItems: (page: number) => void;
	export let browseCursor: string | null = null;
	export let currentPage = 0;
	export let itemsPerPage = 50;
	export let infiniteScroll = false;
	let contentElement: HTMLElement;
	let selectedWorkshopData: WallpaperData | null = null;
	let selectedItemId: string | null = null;
	let currentPageNum: number = currentPage;

	$: currentPageNum = currentPage;

	function handleItemSelect(
		folderName: string,
		wallpaperData: WallpaperData
	) {
		const item = browseItems.find(
			(i) => i.publishedFileId === folderName
		);
		if (item) {
			selectedWorkshopData = wallpaperData;
			selectedItemId = folderName;
		}
	}

	function closeSidebar() {
		selectedWorkshopData = null;
		selectedItemId = null;
	}

	function handlePageChange(page: number) {
		currentPageNum = page;
		onLoadBrowseItems(page);
	}

	function handleScroll(e: Event) {
		if (!infiniteScroll || browseLoading) return;

		const target = e.target as HTMLElement;
		const threshold = 300;
		const isNearBottom =
			target.scrollHeight - target.scrollTop - target.clientHeight <
			threshold;

		const hasMore = totalItems > (currentPageNum + 1) * itemsPerPage;

		if (isNearBottom && hasMore) {
			handlePageChange(currentPageNum + 1);
		}
	}

	$: selectedWallpaper =
		selectedItemId && selectedWorkshopData
			? ({
					...selectedWorkshopData,
					folderName: selectedItemId
				} as Wallpaper)
			: null;

	// Scroll to top only on new search (first page)
	$: if (!browseLoading && browseItems.length > 0 && currentPageNum === 0) {
		if (contentElement && !infiniteScroll) {
			contentElement.scrollTop = 0;
		}
	}

	// Also close sidebar when items change to avoid stale data
	$: if (browseItems) {
		closeSidebar();
	}
</script>

<div class="browse-tab">
	<div class="browse-content">
		<div
			class="scroll-container"
			class:scroll-mask={$settingsStore?.enableScrollMask}
			bind:this={contentElement}
			on:scroll={handleScroll}
		>
			{#if browseLoading && (!infiniteScroll || currentPageNum === 0)}
				<div
					class="loading"
					in:fade={{
						duration: 200
					}}
				>
					<div class="spinner"></div>
					<p>
						Page {currentPageNum + 1}
					</p>
				</div>
			{/if}

			{#if browseItems.length > 0 && !(browseLoading && currentPageNum === 0)}
				<div
					class="results-container"
					in:fly={{
						y: 20,
						duration: 400,
						delay: 100
					}}
					out:fade={{ duration: 200 }}
				>
					{#if viewMode === 'grid'}
						<WallpaperItemGrid
							wallpapers={convertWorkshopItemsToWallpaperPairs(
								browseItems
							)}
							{selectedWallpaper}
							onSelect={handleItemSelect}
							container={contentElement}
						/>
					{:else}
						<WallpaperItemList
							wallpapers={convertWorkshopItemsToWallpaperPairs(
								browseItems
							)}
							{selectedWallpaper}
							onSelect={handleItemSelect}
							container={contentElement}
						/>
					{/if}

					{#if infiniteScroll && browseLoading && currentPageNum > 0}
						<div class="infinite-loading">
							<div class="spinner small"></div>
							<span>Loading more...</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if !infiniteScroll && (browseItems.length > 0 || browseLoading)}
			<BrowsePagination
				currentPage={currentPageNum}
				{totalItems}
				{itemsPerPage}
				hasMore={!!browseCursor}
				isLoading={browseLoading}
				onPageChange={handlePageChange}
			/>
		{/if}
	</div>

	<Sidebar {selectedWallpaper} onClose={closeSidebar} />
</div>

<style lang="scss">
	.browse-tab {
		padding: 0;
		flex: 1;
		display: flex;
		overflow: visible;
		margin-top: 10px;

		.browse-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			position: relative;

			.scroll-container {
				flex: 1;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
				align-items: stretch;
				position: relative;
				padding: 10px;
				overflow-x: hidden;

				&.scroll-mask {
					mask-image: linear-gradient(
						to bottom,
						transparent,
						black 20px,
						black 97%,
						transparent
					);
				}

				.loading {
					position: absolute;
					inset: 0;
					z-index: 50;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					margin: auto;
					color: var(--text-muted);
					gap: 16px;

					.spinner {
						width: 40px;
						height: 40px;
						border: 4px solid var(--border-color);
						border-top-color: var(--btn-primary-bg);
						border-radius: 50%;
						animation: spin 1s linear infinite;
					}

					p {
						margin: 0;
						font-size: 1em;
					}
				}

				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}

				.infinite-loading {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 10px;
					padding: 20px;
					color: var(--text-muted);
					font-size: 0.9em;

					.spinner.small {
						width: 20px;
						height: 20px;
						border-width: 2px;
					}
				}
			}
		}
	}
</style>
