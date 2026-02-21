<script lang="ts">
	import { onMount } from 'svelte';
	import { showToast } from '../scripts/settings';
	import Input from './ui/Input.svelte';
	import Button from './ui/Button.svelte';
	import Select from './ui/Select.svelte';
	import Toggle from './ui/Toggle.svelte';
	import BrowseTab from './browse/BrowseTab.svelte';
	import {
		formatWorkshopItem,
		isValidWorkshopItem,
		type PublishedFileDetails,
		type WorkshopItem
	} from '../utils/workshopHelper';
	import type { FilterConfig } from '../../shared/types';
	import {
		buildFilterCategories,
		mapCategoryToInternal,
		type FilterCategory
	} from '../../shared/filterConstants';
	import { WALLPAPER_ENGINE_APP_ID } from '../../shared/constants';
	import FilterPanel from './browse/FilterPanel.svelte';
	import FilterIcon from '../icons/FilterIcon.svelte';
	import SearchIcon from '../icons/SearchIcon.svelte';

	let workshopFilters: FilterConfig | null = null;
	let filterCategories: FilterCategory[] = [];
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

	const sortOptions = [
		{ label: 'Trend', value: '13' },
		{ label: 'Recent', value: '1' },
		{ label: 'Popular', value: '0' },
		{ label: 'Subscriptions', value: '12' },
		{ label: 'Voted Up', value: '10' },
		{ label: 'Last Updated', value: '19' }
	];

	const itemTypeOptions = [
		{ label: 'All', value: '13' },
		{ label: 'Items', value: '0' },
		{ label: 'Collections', value: '3' }
	];

	const pageSizeOptions = [
		{ label: '50 items', value: '50' },
		{ label: '100 items', value: '100' },
		{ label: '150 items', value: '150' },
		{ label: '200 items', value: '200' }
	];

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
				workshopFilters = result.filters;
				if (workshopFilters) {
					filterCategories =
						buildFilterCategories(workshopFilters);
				}
			}
		} catch (err) {
			console.error('Failed to load filters:', err);
		}
	}

	async function saveFilters(newConfig: FilterConfig) {
		try {
			const result =
				await window.electronAPI.saveWorkshopFilters(newConfig);
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

	function getSearchParameters(): {
		required: string[];
		excluded: string[];
	} {
		if (!workshopFilters) return { required: [], excluded: [] };

		const required: string[] = [];
		const excluded: string[] = [];

		const categoryMap: Record<string, string[]> = {};
		filterCategories.forEach((cat) => {
			let allItems = [...cat.items];
			if (cat.groups) {
				cat.groups.forEach((group) => {
					allItems.push(...group.items);
				});
			}
			categoryMap[mapCategoryToInternal(cat.name)] = allItems;
		});

		const categoryKeys = [
			'tags',
			'typetags',
			'ratingtags',
			'resolutiontags',
			'categorytags',
			'sourcetags',
			'utilitytags'
		];

		categoryKeys.forEach((catKey) => {
			const filterTags = workshopFilters![
				catKey as keyof FilterConfig
			] as Record<string, boolean>;

			const allPossibleTags = categoryMap[catKey] || [];
			if (allPossibleTags.length === 0) return;

			const activeTags = Object.entries(filterTags)
				.filter(([_, active]) => active)
				.map(([tagName, _]) => tagName);

			// If everything is selected, it's the same as no filter for this category
			if (activeTags.length === allPossibleTags.length) {
				return;
			}

			if (catKey === 'ratingtags') {
				// For ratings, we'll use exclusion for anything NOT checked
				allPossibleTags.forEach((tag) => {
					if (!filterTags[tag]) {
						excluded.push(tag);
					}
				});
			} else {
				// For other categories, we add checked ones to required
				activeTags.forEach((tag) => required.push(tag));
			}
		});

		return { required, excluded };
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
			const { required, excluded } = getSearchParameters();

			const result = await window.electronAPI.queryWorkshopFiles({
				search_text: searchText,
				requiredtags: required.length > 0 ? required : undefined,
				excludedtags: excluded.length > 0 ? excluded : undefined,
				page: browsePage,
				query_type: parseInt(sortOrder),
				item_type: parseInt(itemType),
				numperpage: infiniteScroll ? 50 : parseInt(pageSize)
			});

			// Check for backend errors returned in the result structure if any
			if (result?.error) {
				throw new Error(result.error);
			}

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) =>
					formatWorkshopItem(details)
				);

			if (infiniteScroll && browsePage > 1) {
				browseItems = [...browseItems, ...validItems];
			} else {
				browseItems = validItems;
			}
			totalItems = result?.total || 0;

			if (browseItems.length === 0 && !searchError) {
				showToast('No items found', 'info');
			} else if (browseItems.length > 0) {
				showToast(
					`Found ${totalItems.toLocaleString()} items`,
					'success'
				);
			}
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error';
			searchError = errorMsg;
			showToast(`Error searching: ${errorMsg}`, 'error');

			// If we get a Steam initialization / connection error, mark Steam as not running/connected
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
		browsePage = pageNum + 1; // Backend uses 1-based indexing for pages
		searchError = null;
		try {
			const { required, excluded } = getSearchParameters();

			const result = await window.electronAPI.queryWorkshopFiles({
				search_text: searchText,
				requiredtags: required.length > 0 ? required : undefined,
				excludedtags: excluded.length > 0 ? excluded : undefined,
				page: browsePage,
				query_type: parseInt(sortOrder),
				item_type: parseInt(itemType),
				numperpage: 50
			});

			if (result?.error) {
				throw new Error(result.error);
			}

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) =>
					formatWorkshopItem(details)
				);

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
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error';
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

	function openBrowseWithFilters() {
		const { required } = getSearchParameters();
		let url: string;

		if (required.length > 0) {
			url = `https://steamcommunity.com/workshop/browse/?appid=${WALLPAPER_ENGINE_APP_ID}&searchtext=&requiredtags[]=${required[0]}`;
		} else {
			url = `https://steamcommunity.com/workshop/browse/?appid=${WALLPAPER_ENGINE_APP_ID}`;
		}

		window.electronAPI.openExternal(url);
	}
</script>

<div class="workshop-container">
	<div class="workshop-controls">
		<div class="search-section">
			<Button
				variant={showFilterPanel ? 'primary' : 'secondary'}
				on:click={() => (showFilterPanel = !showFilterPanel)}
			>
				<FilterIcon width="18" height="18" />
				Filter
			</Button>
			<Input
				type="text"
				placeholder="Search wallpapers, scenes, collections..."
				bind:value={searchText}
				on:keydown={(e: any) => e.key === 'Enter' && handleSearch()}
			/>
			<div class="search-options">
				<Select
					bind:value={sortOrder}
					options={sortOptions}
					onChange={handleSearch}
				/>
				<Select
					bind:value={itemType}
					options={itemTypeOptions}
					onChange={handleSearch}
				/>
				<Select
					bind:value={pageSize}
					options={pageSizeOptions}
					onChange={handleSearch}
				/>
			</div>
			<div class="search-toggles">
				<label class="toggle-label">
					<Toggle bind:checked={infiniteScroll} />
					<span>Infinite Scroll</span>
				</label>
			</div>
			<Button on:click={handleSearch} disabled={searching}>
				<SearchIcon width="18" height="18" />
				Search
			</Button>
		</div>
	</div>

	<div class="content-area">
		{#if !steamRunning}
			<div class="steam-fallback">
				<div class="fallback-content">
					<div class="fallback-icon">
						<SearchIcon width="64" height="64" />
					</div>
					<h2>Steam is not running</h2>
					<p>
						The Workshop browser requires Steam to be running
						in the background to fetch wallpapers.
					</p>
					{#if searchError}
						<div class="error-notice">
							<p><strong>Error:</strong> {searchError}</p>
						</div>
					{/if}
					<div class="fallback-actions">
						<Button variant="primary" on:click={launchSteam}>
							Launch Steam
						</Button>
						<Button
							variant="secondary"
							on:click={checkSteamStatus}
						>
							Retry Connection
						</Button>
					</div>
				</div>
			</div>
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
				browseCursor={totalItems > browsePage * parseInt(pageSize)
					? 'next'
					: null}
				{totalItems}
				{infiniteScroll}
				onLoadBrowseItems={loadBrowseItems}
				onOpenBrowseWithFilters={openBrowseWithFilters}
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
		background: var(--bg-color);
		border-radius: var(--radius-lg);
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

	.steam-fallback {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		text-align: center;
		background: var(--bg-surface);

		.fallback-content {
			max-width: 400px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20px;

			.fallback-icon {
				color: var(--text-muted);
				opacity: 0.5;
				margin-bottom: 8px;
			}

			h2 {
				margin: 0;
				font-size: 1.8rem;
				font-weight: 700;
				color: var(--text-color);
			}

			p {
				margin: 0;
				line-height: 1.6;
				color: var(--text-muted);
			}

			.error-notice {
				width: 100%;
				padding: 12px 16px;
				background: var(--error-bg-translucent);
				border: 1px solid var(--error-color);
				border-radius: var(--radius-md);
				text-align: left;
				font-size: 0.9rem;

				p {
					color: var(--error-color);
					margin: 0;
				}
			}

			.fallback-actions {
				display: flex;
				gap: 12px;
				margin-top: 12px;
			}
		}
	}

	.workshop-controls {
		padding: 16px 40px;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-surface);

		.search-section {
			display: flex;
			gap: 16px;
			align-items: center;
			width: 100%;

			:global(input) {
				flex: 1;
				min-width: 200px;
			}

			.search-options {
				display: flex;
				gap: 12px;
				min-width: 480px;
			}

			.search-toggles {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-left: 8px;

				.toggle-label {
					display: flex;
					align-items: center;
					gap: 8px;
					font-size: 0.9rem;
					color: var(--text-muted);
					cursor: pointer;
					white-space: nowrap;
				}
			}

			:global(button) {
				white-space: nowrap;
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 10px 20px;
			}
		}
	}
</style>
