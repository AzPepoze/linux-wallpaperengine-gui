<script lang="ts">
	import WallpaperToolbar from './WallpaperToolbar.svelte';
	import FilterPanel from '@/features/wallpaper/FilterPanel.svelte';
	import PathWarning from '@/features/wallpaper/PathWarning.svelte';
	import WallpaperItemGrid from './WallpaperItemGrid.svelte';
	import WallpaperItemList from './WallpaperItemList.svelte';

	import { activeView, showPlaylistManager } from '@/core/ui';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { cloneMode, toggleCloneMode } from '@/features/home/scripts/display';
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
	import { filterWallpapers } from '@/core/utils/wallpaperFilter';
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

	let showFilterPanel = false;
	let installedFilters: FilterConfig | null = null;
	let weConfigError = false;
	let playlists: Playlist[] = [];
	let containerElement: HTMLElement | null = null;
	let steamInstallDates: Record<string, number> = {};

	$: combinedWallpapers = getCombinedWallpapers(
		wallpapers,
		$subscribedIds,
		$downloadingMetadata,
		steamRunning,
		steamInstallDates
	);

	// Reactive filtering of wallpapers
	$: filteredWallpapers = filterWallpapers(
		combinedWallpapers,
		installedFilters,
		$downloadProgress
	);

	// Sorting logic
	$: sortedWallpapers = Object.entries(filteredWallpapers).sort((a, b) => {
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
			const wasRunning = steamRunning;
			steamRunning = await checkSteamStatus();
			
			if (steamRunning && !wasRunning) {
				steamInstallDates = await window.electronAPI.getAllWorkshopInstallInfo();
			}
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

	async function saveFilters(newConfig: FilterConfig) {
		const success = await saveInstalledFilters(newConfig);
		if (success) {
			installedFilters = newConfig;
			showFilterPanel = false;
			logger.log('Home filters applied and saved');
		}
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
		
		if (steamRunning) {
			steamInstallDates = await window.electronAPI.getAllWorkshopInstallInfo();
		}

		onWallpapersRefresh(result.wallpapers);
	}

	async function handleToggleCloneMode() {
		const newMode = !$cloneMode;
		await toggleCloneMode(
			newMode,
			selectedWallpaper?.folderName || activeWallpaper?.folderName
		);
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
			onRefresh={refreshWallpapers}
			onToggleCloneMode={handleToggleCloneMode}
			onLoadPlaylists={loadPlaylists}
		/>
	{/if}

	<div class="content-area">
		{#if showFilterPanel && installedFilters}
			<FilterPanel
				config={installedFilters}
				onSave={saveFilters}
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
				{:else if sortedWallpapers.length === 0}
					<div class="status-msg">
						<p>No wallpapers found matching filters.</p>
						<p class="hint">
							Check your <b>Steam Search Paths</b> in
							<button
								class="link-btn"
								on:click={() =>
									activeView.set('settings')}
								>Settings</button
							>
							if you expect to see more.
						</p>
					</div>
				{:else if viewMode === 'grid'}
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

			.hint {
				font-size: 0.8em;
				margin-top: 12px;
				opacity: 0.8;
			}

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
