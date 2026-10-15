<script lang="ts">
	import { onMount } from 'svelte';
	import { showToast } from '@/core/toastStore';
	import { t } from '@/core/i18n';
	import BrowseTab from './BrowseTab.svelte';
	import type { WorkshopItem } from '@/core/utils/workshopHelper';
	import type { FilterConfig } from '@shared/types';
	import {
		DEFAULT_WORKSHOP_FILTER_CONFIG,
		FILTER_CATEGORIES
	} from '@shared/filterConstants';
	import FilterPanel from '@/features/wallpaper/FilterPanel.svelte';
	import WorkshopControls from './WorkshopControls.svelte';
	import SteamFallback from './SteamFallback.svelte';
	import {
		checkSteamStatus,
		launchSteam,
		loadFilters,
		saveFilters,
		performWorkshopQuery
	} from './Workshop.svelte.ts';

	// Workshop items are always remote, so the Source filter is not searched.
	const searchCategories = FILTER_CATEGORIES.filter(
		(cat) => cat.internalKey !== 'sourcetags'
	);

	let workshopFilters: FilterConfig = DEFAULT_WORKSHOP_FILTER_CONFIG;
	let initialLoadDone = false;
	let showFilterPanel = false;
	let searching = false;
	let searchText = '';
	let browseItems: WorkshopItem[] = [];
	let browseLoading = false;
	let browsePage = 1;
	let totalItems = 0;
	let sortOrder = '0';
	let itemType = '13';
	let pageSize = '50';
	let infiniteScroll = false;
	let viewMode: 'grid' | 'list' = 'grid';

	let steamRunning = true;
	let searchError: string | null = null;
	let searchRequestId = 0;

	onMount(async () => {
		await updateSteamStatus();
		await handleLoadFilters();
		if (steamRunning && !initialLoadDone) {
			initialLoadDone = true;
			handleSearch();
		}
	});

	async function updateSteamStatus() {
		steamRunning = await checkSteamStatus();
	}

	async function handleRetryConnection() {
		await updateSteamStatus();
		if (steamRunning) {
			handleSearch();
		}
	}

	function handleLaunchSteam() {
		launchSteam();
		setTimeout(async () => {
			await updateSteamStatus();
			if (steamRunning) {
				handleSearch();
			}
		}, 5000);
	}

	async function handleLoadFilters() {
		const loaded = await loadFilters();
		if (loaded) {
			workshopFilters = loaded;
		}
	}

	async function handleFilterChange(newConfig: FilterConfig) {
		workshopFilters = newConfig;
		const success = await saveFilters(newConfig);
		if (success) {
			handleSearch();
		}
	}

	async function handleSearch() {
		if (!steamRunning) {
			await updateSteamStatus();
			if (!steamRunning) return;
		}

		searching = true;
		browseLoading = true;
		browsePage = 1;
		browseItems = [];
		searchError = null;
		const requestId = ++searchRequestId;

		try {
			const result = await performWorkshopQuery({
				searchText,
				filters: workshopFilters,
				categories: searchCategories,
				page: browsePage,
				sortOrder,
				itemType,
				pageSize,
				infiniteScroll
			});

			if (requestId !== searchRequestId) return;

			browseItems = result.items;
			totalItems = result.total;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			searchError = errorMsg;
			showToast($t('playlist.messages.errorSearching', { message: errorMsg }), 'error');

			if (
				errorMsg.includes('Steamworks client not initialized') ||
				errorMsg.includes('network connection to steam')
			) {
				steamRunning = false;
			}
		} finally {
			searching = false;
			browseLoading = false;
		}
	}

	async function loadBrowseItems(pageNum: number = 0) {
		browseLoading = true;
		browsePage = pageNum + 1;
		if (!infiniteScroll) {
			browseItems = [];
		}
		searchError = null;
		const requestId = ++searchRequestId;

		try {
			const result = await performWorkshopQuery({
				searchText,
				filters: workshopFilters,
				categories: searchCategories,
				page: browsePage,
				sortOrder,
				itemType,
				pageSize,
				infiniteScroll
			});

			if (requestId !== searchRequestId) return;

			if (infiniteScroll && browsePage > 1) {
				browseItems = [...browseItems, ...result.items];
			} else {
				browseItems = result.items;
			}
			totalItems = result.total;

			if (browseItems.length === 0) {
				showToast($t('playlist.messages.noItemsFound'), 'info');
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			searchError = errorMsg;
			showToast($t('playlist.messages.errorBrowsing', { message: errorMsg }), 'error');

			if (
				errorMsg.includes('Steamworks client not initialized') ||
				errorMsg.includes('network connection to steam')
			) {
				steamRunning = false;
			}
		} finally {
			browseLoading = false;
		}
	}
</script>

<div class="workshop-container">
	<WorkshopControls
		bind:searchText
		bind:sortOrder
		bind:itemType
		bind:pageSize
		bind:infiniteScroll
		bind:viewMode
		{showFilterPanel}
		{searching}
		{totalItems}
		onSearch={handleSearch}
		onToggleFilters={() => (showFilterPanel = !showFilterPanel)}
	/>

	<div class="content-area">
		{#if !steamRunning}
			<SteamFallback
				{searchError}
				onLaunchSteam={handleLaunchSteam}
				onRetry={handleRetryConnection}
			/>
		{:else}
			<FilterPanel
				show={showFilterPanel}
				config={workshopFilters}
				defaults={DEFAULT_WORKSHOP_FILTER_CONFIG}
				hiddenCategories={['Source']}
				onChange={handleFilterChange}
				onClose={() => (showFilterPanel = false)}
			/>

			<BrowseTab
				{browseItems}
				{browseLoading}
				{viewMode}
				{infiniteScroll}
				browseCursor={totalItems > browsePage * parseInt(pageSize)
					? 'next'
					: null}
				{totalItems}
				currentPage={browsePage - 1}
				itemsPerPage={parseInt(pageSize)}
				onLoadBrowseItems={loadBrowseItems}
			/>
		{/if}
	</div>
</div>

<style lang="scss">
	.workshop-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.content-area {
		display: flex;
		flex-direction: row;
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
		position: relative;
	}
</style>
