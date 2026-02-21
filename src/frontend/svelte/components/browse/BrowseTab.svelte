<script lang="ts">
	import { onMount } from 'svelte';
	import Sidebar from '../wallpaper/Sidebar.svelte';
	import BrowsePagination from './BrowsePagination.svelte';
	import ViewToggle from '../ui/ViewToggle.svelte';
	import { fade, fly } from 'svelte/transition';
	import { convertWorkshopItemsToWallpaperRecord } from '../../utils/browse/browseTabUtils';
	import type { WorkshopItem } from '../../utils/workshopHelper';
	import type { WallpaperData, Wallpaper } from '../../../shared/types';
	import WallpaperItemGrid from '../wallpaper/WallpaperItemGrid.svelte';
	import WallpaperItemList from '../wallpaper/WallpaperItemList.svelte';

	export let browseItems: WorkshopItem[] = [];
	export let browseLoading: boolean = false;
	export let totalItems: number = 0;

	export let onLoadBrowseItems: (page: number) => void;
	export const onOpenBrowseWithFilters: () => void = () => {};
	export let autoLoad: boolean = true;
	export let browseCursor: string | null = null;

	let viewMode: 'grid' | 'list' = 'grid';
	let contentElement: HTMLElement;
	let selectedWorkshopData: WallpaperData | null = null;
	let selectedItemId: string | null = null;
	let currentPageNum: number = 0;

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
		selectedWorkshopData = null;
		selectedItemId = null;
	}

	$: selectedWallpaper =
		selectedItemId && selectedWorkshopData
			? ({
					...selectedWorkshopData,
					folderName: selectedItemId
				} as Wallpaper)
			: null;

	// Close sidebar when loading starts
	$: if (browseLoading) {
		closeSidebar();
	}

	// Scroll to top when items finish loading
	$: if (!browseLoading && browseItems.length > 0) {
		if (contentElement) {
			contentElement.scrollTop = 0;
		}
	}

	onMount(() => {
		if (autoLoad) {
			// Load page 0
			currentPageNum = 0;
			onLoadBrowseItems(0);
		}
	});
</script>

<div class="browse-tab">
	<div class="browse-layout">

		<div class="browse-content">
			<div class="toolbar">
				<div class="left-actions">
					{#if totalItems > 0}
						<span class="status-text"
							>{totalItems.toLocaleString()} items found</span
						>
					{/if}
				</div>
				<ViewToggle bind:viewMode />
			</div>

			<div class="scroll-container" bind:this={contentElement}>
				{#if browseLoading}
					<div
						class="loading"
						in:fade={{ duration: 200 }}
						out:fade={{ duration: 200 }}
					>
						<div class="spinner"></div>
						<p>Page {currentPageNum + 1}</p>
					</div>
				{/if}

				{#if !browseLoading && browseItems.length > 0}
					<div
						class="results-container"
						in:fly={{ y: 20, duration: 400, delay: 100 }}
						out:fly={{ y: -20, duration: 200 }}
					>
						{#if viewMode === 'grid'}
							<WallpaperItemGrid
								wallpapers={convertWorkshopItemsToWallpaperRecord(
									browseItems
								)}
								{selectedWallpaper}
								onSelect={handleItemSelect}
								isWorkshop={true}
							/>
						{:else}
							<WallpaperItemList
								wallpapers={convertWorkshopItemsToWallpaperRecord(
									browseItems
								)}
								{selectedWallpaper}
								onSelect={handleItemSelect}
								isWorkshop={true}
							/>
						{/if}
					</div>
				{/if}
			</div>

			{#if browseItems.length > 0}
				<BrowsePagination
					currentPage={currentPageNum}
					{totalItems}
					itemsPerPage={50}
					hasMore={!!browseCursor}
					isLoading={browseLoading}
					onPageChange={handlePageChange}
				/>
			{/if}
		</div>

		<Sidebar {selectedWallpaper} onClose={closeSidebar} />
	</div>
</div>

<style lang="scss">
	.browse-tab {
		padding: 0;
		border-bottom: 1px solid var(--border-color);
		flex: 1;
		display: flex;
		overflow: hidden;

		.loading {
			position: absolute;
			inset: 0;
			z-index: 50;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			color: var(--text-muted);
			gap: 16px;
		}

		.browse-layout {
			display: flex;
			width: 100%;
			height: 100%;

			.browse-content {
				flex: 1;
				display: flex;
				flex-direction: column;
				overflow: hidden;
				position: relative;

				.toolbar {
					padding: 10px 15px;
					display: flex;
					flex-wrap: wrap;
					justify-content: space-between;
					align-items: center;
					background: var(--top-bar-bg);
					border-bottom: 1px solid var(--border-color);
					gap: 15px;
					width: 100%;
					box-sizing: border-box;
					flex-shrink: 0;

					.left-actions {
						display: flex;
						flex: 1;
						justify-content: flex-start;
						align-items: center;

						.status-text {
							font-size: 0.9em;
							color: var(--text-muted);
							font-weight: 500;
						}
					}
				}

				.scroll-container {
					flex: 1;
					overflow-y: auto;
					display: flex;
					flex-direction: column;
					align-items: stretch;
					position: relative;
					padding: 10px;
					overflow-x: hidden;

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

					.results-container {
						flex: 1;
						display: flex;
						flex-direction: column;
					}
				}
			}
		}
	}
</style>
