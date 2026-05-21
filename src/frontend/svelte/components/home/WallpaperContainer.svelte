<script lang="ts">
	import WallpaperToolbar from './WallpaperToolbar.svelte';
	import FilterPanel from '@/components/shared/wallpaper/FilterPanel.svelte';
	import PathWarning from '@/components/shared/wallpaper/PathWarning.svelte';
	import WallpaperItemGrid from './WallpaperItemGrid.svelte';
	import WallpaperItemList from './WallpaperItemList.svelte';

	import { activeView, showPlaylistManager } from '@/scripts/shared/ui';
	import { settingsStore } from '@/scripts/settings/settings';
	import { cloneMode, toggleCloneMode } from '@/scripts/home/display';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { logger } from '@/scripts/shared/logger';
	import {
		downloadProgress,
		downloadingMetadata,
		subscribedIds
	} from '@/scripts/workshop/workshop';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist,
		FilterConfig
	} from '@shared/types';
	import { filterWallpapers } from '@/utils/wallpaperFilter';
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
				{:else if Object.keys(filteredWallpapers).length === 0}
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
						wallpapers={Object.entries(filteredWallpapers)}
						{selectedWallpaper}
						{activePlaylist}
						onSelect={selectWallpaper}
						container={containerElement}
					/>
				{:else}
					<WallpaperItemList
						wallpapers={Object.entries(filteredWallpapers)}
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
