<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { activeView } from '../scripts/ui';
	import { settingsStore, showToast } from '../scripts/settings';
	import Input from './ui/Input.svelte';
	import Button from './ui/Button.svelte';
	import BrowseTab from './browse/BrowseTab.svelte';
	import { logger } from '../scripts/logger';
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
	let steamApiKey = '';
	let hasApiKey = false;
	let browseItems: WorkshopItem[] = [];
	let browseLoading = false;
	let browseCursor: string | null = null;
	let totalItems = 0; // Total items available
	let pageCursors: Map<number, string> = new Map([[0, '*']]); // page -> cursor mapping

	onMount(async () => {
		if ($settingsStore?.steamApiKey) {
			steamApiKey = $settingsStore.steamApiKey;
			hasApiKey = true;
		}
		await loadFilters();
		// Re-trigger search after filters are loaded if it's the first time
		if (!initialLoadDone && hasApiKey) {
			initialLoadDone = true;
			handleSearch();
		}
	});

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
		logger.log('Workshop: saveFilters called');
		try {
			const result =
				await window.electronAPI.saveWorkshopFilters(newConfig);
			if (result.success) {
				workshopFilters = newConfig;
				showFilterPanel = false;
				logger.log(
					'Workshop: Filters applied and saved successfully'
				);
				// Reload items when filters change
				handleSearch();
			} else {
				logger.error(
					'Workshop: Failed to save filters - result was not success'
				);
			}
		} catch (err) {
			console.error('Failed to save filters:', err);
			logger.error('Workshop: Exception in saveFilters:', err);
		}
	}

	async function handleFilterChange(newConfig: FilterConfig) {
		workshopFilters = newConfig;
		// Just trigger search, don't save to backend every toggle to avoid excessive disk I/O
		// We'll save when the user closes or manually hits apply if we kept it
		// Actually, let's save too, it's just a JSON write.
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

		const categories = [
			'tags',
			'typetags',
			'ratingtags',
			'resolutiontags',
			'categorytags',
			'sourcetags',
			'utilitytags'
		];

		categories.forEach((cat) => {
			const filterTags = workshopFilters![
				cat as keyof FilterConfig
			] as Record<string, boolean>;
			const allPossibleTags = categoryMap[cat] || [];

			const activeTags = Object.entries(filterTags)
				.filter(([_, active]) => active)
				.map(([tagName, _]) => tagName);

			if (
				cat !== 'ratingtags' &&
				activeTags.length === allPossibleTags.length &&
				allPossibleTags.length > 0
			) {
				return;
			}

			activeTags.forEach((tag) => required.push(tag));

			if (cat === 'ratingtags') {
				allPossibleTags.forEach((tag) => {
					if (!filterTags[tag]) {
						excluded.push(tag);
					}
				});
			}
		});

		return { required, excluded };
	}

	async function handleSearch() {
		searching = true;
		browseLoading = true;
		try {
			const { required, excluded } = getSearchParameters();
			logger.log(
				'Workshop: Starting search with required tags:',
				required.join(', ')
			);
			if (excluded.length > 0) {
				logger.log(
					'Workshop: Excluding tags:',
					excluded.join(', ')
				);
			}

			const result = await window.electronAPI.queryWorkshopFiles(
				steamApiKey,
				{
					search_text: searchText,
					requiredtags:
						required.length > 0 ? required : undefined,
					excludedtags:
						excluded.length > 0 ? excluded : undefined,
					cursor: '*',
					numperpage: 50
				}
			);

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) =>
					formatWorkshopItem(details)
				);

			browseItems = validItems;
			totalItems = result?.total || 0;
			pageCursors = new Map([[0, '*']]);
			if (result?.nextCursor) {
				pageCursors.set(1, result.nextCursor);
			}
			browseCursor = result?.nextCursor || null;

			if (browseItems.length === 0) {
				showToast('No items found', 'info');
			} else {
				showToast(
					`Found ${totalItems.toLocaleString()} items`,
					'success'
				);
			}
		} catch (error) {
			console.error('Error searching:', error);
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error';
			showToast(`Error searching: ${errorMsg}`, 'error');
		} finally {
			searching = false;
			browseLoading = false;
		}
	}

	async function loadBrowseItems(pageNum: number = 0) {
		browseLoading = true;
		try {
			const { required, excluded } = getSearchParameters();

			// Get cursor for this page (default to '*' for first page)
			const cursor =
				pageCursors.get(pageNum) || (pageNum === 0 ? '*' : null);
			if (!cursor) {
				showToast('No more pages available', 'info');
				return;
			}

			logger.log(
				'Workshop: loadBrowseItems called: page=' +
					pageNum +
					' required=' +
					required.length +
					' excluded=' +
					excluded.length
			);
			const result = await window.electronAPI.queryWorkshopFiles(
				steamApiKey,
				{
					requiredtags:
						required.length > 0 ? required : undefined,
					excludedtags:
						excluded.length > 0 ? excluded : undefined,
					cursor: cursor,
					numperpage: 50
				}
			);

			logger.log(
				'Workshop: API Response: total=' +
					result?.total +
					' items=' +
					(result?.items?.length || 0) +
					' nextCursor=' +
					!!result?.nextCursor
			);

			const validItems = (result?.items || [])
				.filter(isValidWorkshopItem)
				.map((details: PublishedFileDetails) =>
					formatWorkshopItem(details)
				);

			// Always replace items (don't accumulate across pages)
			browseItems = validItems;
			totalItems = result?.total || 0;
			const firstItem =
				validItems.length > 0 ? validItems[0].title : 'none';
			logger.log(
				'Workshop: Loaded page ' +
					pageNum +
					' | First item: ' +
					firstItem
			);

			// Store the next cursor if available
			if (result?.nextCursor) {
				pageCursors.set(pageNum + 1, result.nextCursor);
				browseCursor = result.nextCursor; // Enable Next button
			} else {
				browseCursor = null; // No more pages
			}

			logger.log(
				'Workshop: Loaded ' +
					validItems.length +
					' items | Next button: ' +
					!!browseCursor
			);

			if (browseItems.length === 0) {
				showToast('No items found', 'info');
			}
		} catch (error) {
			console.error('Error browsing workshop:', error);
			const errorMsg =
				error instanceof Error ? error.message : 'Unknown error';
			showToast(`Error browsing workshop: ${errorMsg}`, 'error');
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

	async function setupSteamApiKey() {
		activeView.set('settings');
		await tick();
		const settingsSection = document.querySelector(
			'[data-section="steam-api-key"]'
		);
		if (settingsSection) {
			settingsSection.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<div class="workshop-container">
	{#if !hasApiKey}
		<div class="no-api-key">
			<div class="no-api-key-content">
				<h2>Steam API Key Required</h2>
				<p>
					To access the Steam Workshop features, you need to
					configure your Steam API key in the settings.
				</p>
				<Button on:click={setupSteamApiKey}
					>Get Steam API Key</Button
				>
			</div>
		</div>
	{:else}
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
					on:keydown={(e: any) =>
						e.key === 'Enter' && handleSearch()}
				/>
				<Button on:click={handleSearch} disabled={searching}>
					<SearchIcon width="18" height="18" />
					Search
				</Button>
			</div>
		</div>

		<div class="content-area">
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
				{browseCursor}
				{totalItems}
				autoLoad={false}
				onLoadBrowseItems={loadBrowseItems}
				onOpenBrowseWithFilters={openBrowseWithFilters}
			/>
		</div>
	{/if}
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
	}

	.no-api-key {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 40px;
		text-align: center;

		.no-api-key-content {
			max-width: 500px;

			h2 {
				margin: 0 0 16px;
				font-size: 1.5em;
				color: var(--text-color);
			}

			p {
				margin: 0 0 24px;
				color: var(--text-muted);
				line-height: 1.6;
			}

			:global(button) {
				margin: 0 auto;
				display: block;
			}
		}
	}

	.workshop-controls {
		padding: 20px 40px;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-surface);

		.search-section {
			display: flex;
			gap: 12px;
			align-items: center;
			width: 100%;

			:global(input) {
				flex: 1;
				min-width: 300px;
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
