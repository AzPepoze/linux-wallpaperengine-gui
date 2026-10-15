<script lang="ts">
	import WallpaperToolbar from './WallpaperToolbar.svelte';
	import FilterPanel from '@/features/wallpaper/FilterPanel.svelte';
	import PathWarning from '@/features/wallpaper/PathWarning.svelte';
	import WallpaperItemGrid from './WallpaperItemGrid.svelte';
	import WallpaperItemList from './WallpaperItemList.svelte';

	import { activeView, showPlaylistManager } from '@/core/ui';
	import { t } from '@/core/i18n';
	import EmptyState from '@/ui/EmptyState.svelte';
	import Icon from '@/ui/Icon.svelte';
	import Button from '@/ui/Button.svelte';
	import { fade } from 'svelte/transition';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { logger } from '@/core/logger';
	import {
		downloadProgress,
		downloadingMetadata,
		subscribedIds
	} from '@/features/workshop/scripts/workshop';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist,
		FilterConfig
	} from '@shared/types';
	import { DEFAULT_INSTALLED_FILTER_CONFIG } from '@shared/filterConstants';
	import { filterWallpapers, searchWallpapers } from '@/core/utils/wallpaperFilter';
	import {
		checkSteamStatus,
		loadInstalledFilters,
		saveInstalledFilters,
		fetchPlaylists,
		fetchWallpapers,
		getCombinedWallpapers
	} from './WallpaperContainer.svelte.ts';

	let steamRunning = false;

	export let wallpapers: Record<string, WallpaperData> = {};
	export let activeWallpaper: Wallpaper | null = null;
	export let selectedWallpaper: Wallpaper | null = null;
	export let selectedScreen: string | null = null;
	export let loading: boolean = true;
	export let workshopPathValid: boolean = true;
	export let wallpaperEnginePathValid: boolean = true;
	export let error: string | null = null;
	export let playlistManager: any = null;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void = () => {};
	export let onWallpapersRefresh: (
		wallpapers: Record<string, WallpaperData>
	) => void = () => {};

	let viewMode: 'grid' | 'list' | 'detail' = 'grid';
	let sortMethod: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' = 'date-desc';
	let searchQuery: string = '';

	let showFilterPanel = false;
	let installedFilters: FilterConfig | null = null;
	let weConfigError = false;
	let playlists: Playlist[] = [];
	let containerElement: HTMLElement | null = null;

	$: combinedWallpapers = getCombinedWallpapers(
		wallpapers,
		$subscribedIds,
		$downloadingMetadata,
		steamRunning
	);

	// Reactive filtering of wallpapers
	$: filteredWallpapers = filterWallpapers(
		combinedWallpapers,
		installedFilters,
		$downloadProgress
	);

	// Reactive search filtering
	$: searchedWallpapers = searchWallpapers(filteredWallpapers, searchQuery);

	// Sorting logic
	$: sortedWallpapers = Object.entries(searchedWallpapers).sort((a, b) => {
		const wpA = a[1];
		const wpB = b[1];
		
		if (sortMethod.startsWith('date')) {
			const dateA = wpA.installDate || 0;
			const dateB = wpB.installDate || 0;
			return sortMethod === 'date-desc' ? dateB - dateA : dateA - dateB;
		} else {
			const nameA = (wpA.projectData?.title || a[0]).toLowerCase();
			const nameB = (wpB.projectData?.title || b[0]).toLowerCase();
			if (nameA < nameB) return sortMethod === 'name-asc' ? -1 : 1;
			if (nameA > nameB) return sortMethod === 'name-asc' ? 1 : -1;
			return 0;
		}
	});

	$: activePlaylist = playlists.find(
		(p) => p.name === $settingsStore?.playlist
	);

	onMount(() => {
		window.electronAPI.on('wallpaper-folder-changed', (data) => {
			logger.log(
				`[DEBUG] Received wallpaper-folder-changed event: ${JSON.stringify(data)}`
			);
			refreshWallpapers();
		});

		// Check Steam status
		async function updateSteamStatus() {
			steamRunning = await checkSteamStatus();
		}
		updateSteamStatus();
		const steamInterval = setInterval(updateSteamStatus, 5000);

		Promise.all([
			loadPlaylists(),
			loadFilters(),
			refreshWallpapers()
		]);

		return () => {
			clearInterval(steamInterval);
		};
	});

	async function loadFilters() {
		installedFilters = await loadInstalledFilters();
	}

	function handleFilterChange(newConfig: FilterConfig) {
		installedFilters = newConfig;
		saveInstalledFilters(newConfig);
	}

	async function loadPlaylists() {
		const result = await fetchPlaylists();
		playlists = result.playlists;
		weConfigError = result.weConfigError;
	}

	function selectWallpaper(folderName: string, wallpaper: WallpaperData) {
		if (get(showPlaylistManager) && playlistManager) {
			playlistManager.addWallpaperToPlaylist(folderName);
		} else {
			onSelect(folderName, wallpaper);
		}
	}

	export function refreshPlaylists() {
		loadPlaylists();
	}

	async function refreshWallpapers() {
		const result = await fetchWallpapers();
		wallpapers = result.wallpapers;
		workshopPathValid = result.workshopPathValid;
		wallpaperEnginePathValid = result.wallpaperEnginePathValid;

		onWallpapersRefresh(result.wallpapers);
	}

	// Hide sidebar when loading
	$: if (loading) {
		selectedWallpaper = null;
	}
</script>

<div class="container">
	{#if workshopPathValid}
		<WallpaperToolbar
			{activeWallpaper}
			{selectedScreen}
			bind:showFilterPanel
			bind:viewMode
			bind:sortMethod
			bind:searchQuery
			onRefresh={refreshWallpapers}
			onLoadPlaylists={loadPlaylists}
		/>
	{/if}

	<div class="content-area">
		{#if installedFilters}
			<FilterPanel
				show={showFilterPanel}
				config={installedFilters}
				defaults={DEFAULT_INSTALLED_FILTER_CONFIG}
				onChange={handleFilterChange}
				onClose={() => (showFilterPanel = false)}
			/>
		{/if}

		<div
			class="wallpaper-container"
			class:scroll-mask={$settingsStore?.enableScrollMask}
			bind:this={containerElement}
		>
			{#if !workshopPathValid}
				<div class="warning-center-wrapper">
					<PathWarning type="workshop" />
				</div>
			{:else if weConfigError}
				<div class="warning-center-wrapper">
					<PathWarning type="we_config" delay={100} />
				</div>
			{:else}
				{#if !wallpaperEnginePathValid}
					<PathWarning type="assets" delay={100} />
				{/if}

			{#if loading}
				<div class="status-msg">Loading...</div>
			{:else if error}
				<div class="status-msg error">{error}</div>
			{:else}
				{#if sortedWallpapers.length > 0}
					{#if viewMode === 'grid'}
						<WallpaperItemGrid
							wallpapers={sortedWallpapers}
							{selectedWallpaper}
							{activePlaylist}
							onSelect={selectWallpaper}
							container={containerElement}
						/>
					{:else}
						<WallpaperItemList
							wallpapers={sortedWallpapers}
							{selectedWallpaper}
							{activePlaylist}
							onSelect={selectWallpaper}
							container={containerElement}
						/>
					{/if}
				{/if}

				{#if sortedWallpapers.length === 0}
					<div class="empty-overlay" transition:fade={{ duration: 200 }}>
						{#if searchQuery.trim()}
							<EmptyState
								icon="search_off"
								title={$t('wallpaper.search.noResults')}
								description={$t('wallpaper.search.noResultsHint')}
							>
								<Button
									variant="primary"
									on:click={() => (searchQuery = '')}
									style="padding: 10px 22px; border-radius: 12px; font-size: 0.95em;"
								>
									<Icon name="close" size={18} />
									<span>{$t('wallpaper.search.clear')}</span>
								</Button>
							</EmptyState>
						{:else}
							<EmptyState icon="wallpaper" title="No wallpapers found matching filters.">
								<svelte:fragment slot="hint">
									<p class="empty-custom-hint">
										Check your <b>Steam Search Paths</b> in
										<button
											class="link-btn"
											on:click={() => activeView.set('settings')}
											>Settings</button
										>
										if you expect to see more.
									</p>
								</svelte:fragment>
							</EmptyState>
						{/if}
					</div>
				{/if}
			{/if}
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 100%;
		min-height: 0;
	}

	.content-area {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		min-height: 0;
	}

	.wallpaper-container {
		flex-grow: 1;
		text-align: center;
		overflow-y: auto;
		position: relative;
		display: flex;
		flex-direction: column;

		&.scroll-mask {
			mask-image: linear-gradient(
				to bottom,
				transparent,
				black 20px,
				black 97%,
				transparent
			);
		}

		.warning-center-wrapper {
			display: flex;
			flex-grow: 1;
			align-items: center;
			justify-content: center;
			padding: 40px;
			min-height: 100%;
		}

		.status-msg {
			padding: 40px;
			color: var(--text-muted);
			font-size: 1.1em;

			&.error {
				color: var(--error-color);
			}
		}

		.empty-overlay {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			pointer-events: none;
			z-index: 10;
			padding: 40px;
		}

		:global(.empty-overlay > *) {
			pointer-events: auto;
		}

		.empty-custom-hint {
			margin: 0;
			font-size: 1em;
			color: var(--text-muted);
			text-align: center;

			.link-btn {
				background: none;
				border: none;
				color: var(--btn-primary-bg);
				font-weight: 600;
				cursor: pointer;
				padding: 0;
				text-decoration: underline;
				font-size: inherit;

				&:hover {
					color: var(--btn-primary-hover-bg);
				}
			}
		}
	}
</style>
