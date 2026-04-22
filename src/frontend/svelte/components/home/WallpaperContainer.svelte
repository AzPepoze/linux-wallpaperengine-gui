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
	import { DEFAULT_INSTALLED_FILTER_CONFIG } from '@shared/filterConstants';
	import { filterWallpapers } from '@/utils/wallpaperFilter';

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

	// Combine wallpapers with subscriptions/downloads
	$: combinedWallpapers = (() => {
		const combined: Record<string, WallpaperData> = { ...wallpapers };
		const subscribedList = Array.from($subscribedIds);

		// Add subscribed items missing from disk
		subscribedList.forEach((fileId) => {
			if (!combined[fileId] && $downloadingMetadata[fileId]) {
				combined[fileId] = $downloadingMetadata[fileId];
			}
		});

		// 2. Filter workshop items - show all when Steam is disconnected
		const result: Record<string, WallpaperData> = {};
		Object.entries(combined).forEach(([id, data]) => {
			const isWorkshop =
				!!data.projectData?.workshopid ||
				!!data.projectData?.isWorkshop ||
				/^\d+$/.test(id);

			if (isWorkshop) {
				// Show all when Steam offline, otherwise only subscribed
				if (!steamRunning || $subscribedIds.has(id)) {
					result[id] = data;
				}
			} else {
				// Local wallpapers always shown
				result[id] = data;
			}
		});

		return result;
	})();

	// Reactive filtering of wallpapers
	$: filteredWallpapers = filterWallpapers(
		combinedWallpapers,
		installedFilters,
		$downloadProgress
	);

	$: activePlaylist = playlists.find(
		(p) => p.name === $settingsStore?.playlist
	);

	onMount(async () => {
		window.electronAPI.on('wallpaper-folder-changed', (data) => {
			logger.log(
				`[DEBUG] Received wallpaper-folder-changed event: ${JSON.stringify(data)}`
			);
			refreshWallpapers();
		});

		// Check Steam status
		async function checkSteamStatus() {
			steamRunning = await window.electronAPI.isSteamRunning();
		}
		checkSteamStatus();
		setInterval(checkSteamStatus, 5000);

		await Promise.all([
			loadPlaylists(),
			loadFilters(),
			refreshWallpapers()
		]);
	});

	async function loadFilters() {
		try {
			const result = await window.electronAPI.getInstalledFilters();
			if (result.success) {
				// Merge with default config to ensure all fixed filters are present
				installedFilters = {
					...DEFAULT_INSTALLED_FILTER_CONFIG,
					...result.filters
				};
			} else {
				installedFilters = { ...DEFAULT_INSTALLED_FILTER_CONFIG };
			}
		} catch (err) {
			console.error('Failed to load filters:', err);
			installedFilters = { ...DEFAULT_INSTALLED_FILTER_CONFIG };
		}
	}

	async function saveFilters(newConfig: FilterConfig) {
		try {
			const result =
				await window.electronAPI.saveInstalledFilters(newConfig);
			if (result.success) {
				installedFilters = newConfig;
				showFilterPanel = false;
				logger.log('Home filters applied and saved');
			}
		} catch (err) {
			console.error('Failed to save filters:', err);
			logger.error('Failed to save home filters:', err);
		}
	}

	function handleFilterChange(newConfig: FilterConfig) {
		installedFilters = newConfig;
		// Local filtering is lucky enough to be reactive, so just updating the state is enough
		// We should also save it so it persists
		window.electronAPI.saveInstalledFilters(newConfig).catch((err) => {
			console.error('Failed to auto-save home filters:', err);
		});
	}

	async function loadPlaylists() {
		try {
			const result = await window.electronAPI.getPlaylists();
			if (result.success && result.playlists) {
				playlists = result.playlists;
				weConfigError = false;
			} else if (
				result.error &&
				result.error.includes(
					'Wallpaper Engine configuration not found'
				)
			) {
				weConfigError = true;
			}
		} catch (err) {
			console.error('Failed to load playlists:', err);
		}
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
		const {
			wallpapers: loadedWallpapers,
			workshopPathValid: loadedWorkshopPathValid,
			wallpaperEnginePathValid: loadedwallpaperEnginePathValid
		} = await window.electronAPI.loadWallpapers();

		logger.log(
			`[DEBUG] refreshWallpapers loaded ${Object.keys(loadedWallpapers).length} wallpapers`
		);
		wallpapers = loadedWallpapers;
		workshopPathValid = loadedWorkshopPathValid;
		wallpaperEnginePathValid = loadedwallpaperEnginePathValid;
		onWallpapersRefresh(loadedWallpapers);
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
						wallpapers={filteredWallpapers}
						{selectedWallpaper}
						{activePlaylist}
						onSelect={selectWallpaper}
					/>
				{:else}
					<WallpaperItemList
						wallpapers={filteredWallpapers}
						{selectedWallpaper}
						{activePlaylist}
						onSelect={selectWallpaper}
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
