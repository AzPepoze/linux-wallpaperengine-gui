<script lang="ts">
	import { onMount } from 'svelte';
	import { showToast } from '@/scripts/settings/settings';
	import BrowseTab from './BrowseTab.svelte';
	import {
		formatWorkshopItem,
		isValidWorkshopItem,
		type PublishedFileDetails,
		type WorkshopItem
	} from '@/utils/workshopHelper';
	import type { FilterConfig } from '@shared/types';
	import {
		buildFilterCategories,
		DEFAULT_WORKSHOP_FILTER_CONFIG,
		type FilterCategory
	} from '@shared/filterConstants';
	import FilterPanel from '@/components/shared/wallpaper/FilterPanel.svelte';
	import WorkshopControls from './WorkshopControls.svelte';
	import SteamFallback from './SteamFallback.svelte';
	import { getSearchParameters } from '@/scripts/workshop/workshopSearch';

	let workshopFilters: FilterConfig = { ...DEFAULT_WORKSHOP_FILTER_CONFIG };
	let filterCategories: FilterCategory[] = buildFilterCategories();
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

	onMount(async () => {
		await checkSteamStatus();
		await loadFilters();
		if (steamRunning && !initialLoadDone) {
			initialLoadDone = true;
			handleSearch();
		}
	});

	async function checkSteamStatus() {
		try {
			steamRunning = await window.electronAPI.isSteamRunning();
		} catch (err) {
			console.error('Failed to check Steam status:', err);
			steamRunning = false;
		}
	}

	function launchSteam() {
		window.electronAPI.openExternal('steam://open/main');
		setTimeout(checkSteamStatus, 5000);
	}

	async function loadFilters() {
		try {
			const result = await window.electronAPI.getWorkshopFilters();
			if (result.success) {
				workshopFilters = {
					...DEFAULT_WORKSHOP_FILTER_CONFIG,
					...result.filters
				};
				filterCategories = buildFilterCategories(workshopFilters);
			}
		} catch (err) {
			console.error('Failed to load filters:', err);
		}
	}

	async function saveFilters(newConfig: FilterConfig) {
		try {
			const result = await window.electronAPI.saveWorkshopFilters(newConfig);
			if (result.success) {
				workshopFilters = newConfig;
				showFilterPanel = false;
				handleSearch();
			}
		} catch (err) {
			console.error('Failed to save filters:', err);
		}
	}

	async function handleFilterChange(newConfig: FilterConfig) {
		workshopFilters = newConfig;
		try {
			await window.electronAPI.saveWorkshopFilters(newConfig);
			handleSearch();
		} catch (err) {
			console.error('Failed to save filters on change:', err);
		}
	}

	async function handleSearch() {
		if (!steamRunning) {
			await checkSteamStatus();
			if (!steamRunning) return;
		}

		searching = true;
		browseLoading = true;
		browsePage = 1;
		searchError = null;
		try {
			const { required, excluded } = getSearchParameters(
				workshopFilters,
				filterCategories
			);

			const result = await window.electronAPI.queryWorkshopFiles({
				search_text: searchText,
				requiredtags: required.length > 0 ? required : undefined,
				excludedtags: excluded.length > 0 ? excluded : undefined,
				page: browsePage,
				query_type: parseInt(sortOrder),
				item_type: parseInt(itemType),
				numperpage: infiniteScroll ? 50 : parseInt(pageSize)
			});

			if (result?.error) {
				throw new Error(result.error);
			}

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) => formatWorkshopItem(details));

			if (infiniteScroll && browsePage > 1) {
				browseItems = [...browseItems, ...validItems];
			} else {
				browseItems = validItems;
			}
			totalItems = result?.total || 0;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			searchError = errorMsg;
			showToast(`Error searching: ${errorMsg}`, 'error');

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
		searchError = null;
		try {
			const { required, excluded } = getSearchParameters(
				workshopFilters,
				filterCategories
			);

			const result = await window.electronAPI.queryWorkshopFiles({
				search_text: searchText,
				requiredtags: required.length > 0 ? required : undefined,
				excludedtags: excluded.length > 0 ? excluded : undefined,
				page: browsePage,
				query_type: parseInt(sortOrder),
				item_type: parseInt(itemType),
				numperpage: parseInt(pageSize)
			});

			if (result?.error) {
				throw new Error(result.error);
			}

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) => formatWorkshopItem(details));

			if (infiniteScroll && browsePage > 1) {
				browseItems = [...browseItems, ...validItems];
			} else {
				browseItems = validItems;
			}
			totalItems = result?.total || 0;

			if (browseItems.length === 0) {
				showToast('No items found', 'info');
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			searchError = errorMsg;
			showToast(`Error browsing workshop: ${errorMsg}`, 'error');

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
				onLaunchSteam={launchSteam}
				onRetry={checkSteamStatus}
			/>
		{:else}
			{#if showFilterPanel && workshopFilters}
				<FilterPanel
					config={workshopFilters}
					onSave={saveFilters}
					onChange={handleFilterChange}
					onClose={() => (showFilterPanel = false)}
				/>
			{/if}

			<BrowseTab
				{browseItems}
				{browseLoading}
				{viewMode}
				browseCursor={totalItems > browsePage * parseInt(pageSize) ? 'next' : null}
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
		overflow: hidden;
		position: relative;
	}
</style>
