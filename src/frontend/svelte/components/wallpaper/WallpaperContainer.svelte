<script lang="ts">
	import DisplayIcon from '../../icons/DisplayIcon.svelte';
	import ApplyAllIcon from '../../icons/ApplyAllIcon.svelte';
	import PlaylistIcon from '../../icons/PlaylistIcon.svelte';
	import Button from '../ui/Button.svelte';
	import ViewToggle from '../ui/ViewToggle.svelte';
	import Refresh from '../ui/Refresh.svelte';
	import FilterIcon from '../../icons/FilterIcon.svelte';
	import FilterPanel from '../browse/FilterPanel.svelte';

	import { showDisplayManager, showPlaylistManager } from '../../scripts/ui';
	import { settingsStore } from '../../scripts/settings';
	import { cloneMode, toggleCloneMode } from '../../scripts/display';
	import { get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { logger } from '../../scripts/logger';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist,
		FilterConfig
	} from '../../../shared/types';
	import WallpaperItemGrid from './WallpaperItemGrid.svelte';
	import WallpaperItemList from './WallpaperItemList.svelte';

	export let wallpapers: Record<string, WallpaperData> = {};
	export let activeWallpaper: Wallpaper | null = null;
	export let selectedWallpaper: Wallpaper | null = null;
	export let selectedScreen: string | null = null;
	export let loading: boolean = true;
	export let error: string | null = null;
	export let playlistManager: any = null;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void = () => {};

	let viewMode: 'grid' | 'list' | 'detail' = 'grid';

	let showFilterPanel = false;
	let installedFilters: FilterConfig | null = null;
	let playlists: Playlist[] = [];

	// Reactive filtering of wallpapers
	$: filteredWallpapers = (() => {
		if (!installedFilters) return wallpapers;

		// Extract active tags by category
		const activeTags: Record<string, string[]> = {};
		const categories = [
			'tags', 'typetags', 'ratingtags', 'resolutiontags', 
			'categorytags', 'sourcetags', 'utilitytags'
		];

		let hasAnyFilter = false;
		categories.forEach(cat => {
			const tags = installedFilters![cat as keyof FilterConfig] as Record<string, boolean>;
			const active = Object.entries(tags)
				.filter(([_, val]) => val)
				.map(([name, _]) => name.toLowerCase());
			
			if (active.length > 0) {
				activeTags[cat] = active;
				hasAnyFilter = true;
			}
		});

		if (!hasAnyFilter) return wallpapers;

		const filtered: Record<string, WallpaperData> = {};
		Object.entries(wallpapers).forEach(([folderName, data]) => {
			const projectData = data.projectData;
			const wpTags = (projectData?.tags || []).map(t => t.toLowerCase());
			const wpType = projectData?.type?.toLowerCase();
			let wpRating = projectData?.contentrating?.toLowerCase() || '';
			const wpApproved = projectData?.approved;

			// If rating is missing, default to everyone (common for local items)
			// Also check if 'everyone' or 'age-everyone' is in tags as fallback
			if (!wpRating) {
				if (wpTags.includes('everyone') || wpTags.includes('age-everyone')) {
					wpRating = 'everyone';
				} else {
					wpRating = 'everyone'; // Safe default
				}
			}

			// Logic: Categories are ANDed, tags within are ORed
			let matches = true;
			for (const [cat, tags] of Object.entries(activeTags)) {
				if (cat === 'typetags') {
					if (!tags.includes(wpType || '')) {
						matches = false;
						break;
					}
				} else if (cat === 'ratingtags') {
					// Check contentrating field explicitly for age ratings
					if (!tags.includes(wpRating || '')) {
						matches = false;
						break;
					}
				} else if (cat === 'sourcetags') {
					// Local wallpapers are either 'workshop' (if they have id) or 'local'
					const isWorkshop = !!projectData?.workshopid || /^\d+$/.test(folderName);
					const canShowWorkshop = tags.includes('workshop');
					const canShowLocal = tags.includes('local');
					
					if (isWorkshop && canShowWorkshop) continue;
					if (!isWorkshop && canShowLocal) continue;
					
					matches = false;
					break;
				} else if (cat === 'utilitytags') {
					// Approved is a special utility tag
					const needsApproved = tags.includes('approved');
					if (needsApproved && !wpApproved) {
						matches = false;
						break;
					}
					
					// Other utility tags check current tags
					const otherUtilityTags = tags.filter(t => t !== 'approved');
					if (otherUtilityTags.length > 0) {
						const hasTagInCat = otherUtilityTags.some(t => wpTags.includes(t));
						if (!hasTagInCat) {
							matches = false;
							break;
						}
					}
				} else if (cat === 'categorytags') {
					// Local items are almost always 'wallpaper'
					const isWallpaperFilter = tags.includes('wallpaper');
					if (isWallpaperFilter) {
						continue;
					} else {
						// Only fail if user has specific category filters and none match
						const hasTagInCat = tags.some(t => wpTags.includes(t));
						if (!hasTagInCat) {
							matches = false;
							break;
						}
					}
				} else if (cat === 'resolutiontags') {
					// Skip resolution filtering for local items for now
					continue;
				} else {
					// Check if wallpaper has any of the tags in this category
					const hasTagInCat = tags.some(t => wpTags.includes(t));
					if (!hasTagInCat) {
						matches = false;
						break;
					}
				}
			}

			if (matches) {
				filtered[folderName] = data;
			}
		});

		return filtered;
	})();

	$: activePlaylist = playlists.find(
		(p) => p.name === $settingsStore?.playlist
	);

	onMount(async () => {
		await Promise.all([
			loadPlaylists(),
			loadFilters()
		]);
	});

	async function loadFilters() {
		try {
			const result = await window.electronAPI.getInstalledFilters();
			if (result.success) {
				installedFilters = result.filters;
			}
		} catch (err) {
			console.error('Failed to load filters:', err);
		}
	}

	async function saveFilters(newConfig: FilterConfig) {
		try {
			const result = await window.electronAPI.saveInstalledFilters(newConfig);
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
		window.electronAPI.saveInstalledFilters(newConfig).catch(err => {
			console.error('Failed to auto-save home filters:', err);
		});
	}

	async function loadPlaylists() {
		try {
			const result = await window.electronAPI.getPlaylists();
			if (result.success && result.playlists) {
				playlists = result.playlists;
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
		const { wallpapers: loadedWallpapers } =
			await window.electronAPI.loadWallpapers();
		wallpapers = loadedWallpapers;
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
	<div class="toolbar">
		<div class="left-actions">
			<Button
				variant={$showPlaylistManager ? 'primary' : 'secondary'}
				on:click={() => {
					showPlaylistManager.update((v) => !v);
					if ($showPlaylistManager) loadPlaylists();
				}}
				title="Toggle Playlist Manager"
				style="padding: 8px; margin-right: 5px; border-radius: 10px;"
			>
				<PlaylistIcon width="20" height="20" />
				<span>Playlist</span>
			</Button>

			<Button
				variant={showFilterPanel ? 'primary' : 'secondary'}
				on:click={() => (showFilterPanel = !showFilterPanel)}
				title="Filter Wallpapers"
				style="padding: 8px; margin-right: 5px; border-radius: 10px;"
			>
				<FilterIcon width="20" height="20" />
				<span>Filter</span>
			</Button>
		</div>

		<div class="status-info">
			<div class="status-item">
				<span class="label">CURRENTLY USING :</span>
				{#if activeWallpaper}
					<span
						in:fly={{ y: 20, duration: 300 }}
						out:fly={{ y: -20, duration: 300 }}
						class="value"
						>{activeWallpaper.projectData?.title ||
							activeWallpaper.folderName}</span
					>
				{/if}
			</div>
			<div class="status-item">
				<span class="label">DISPLAY :</span>
				{#if selectedScreen || $cloneMode}
					<span
						in:fly={{ y: 20, duration: 300 }}
						out:fly={{ y: -20, duration: 300 }}
						class="value"
						>{$cloneMode ? 'ALL' : selectedScreen}</span
					>
				{/if}

				<Button
					variant={$showDisplayManager ? 'primary' : 'secondary'}
					on:click={() => showDisplayManager.update((v) => !v)}
					title="Toggle Display Manager"
					style="padding: 8px; margin-right: 5px; border-radius: 10px;"
				>
					<DisplayIcon width="20" height="20" />
					<span>Display</span>
				</Button>

				<Button
					variant={$cloneMode ? 'primary' : 'secondary'}
					on:click={handleToggleCloneMode}
					title="Clone mode (Apply to all displays)"
					style="padding: 8px; margin-right: 10px; border-radius: 10px;"
				>
					<ApplyAllIcon width="20" height="20" />
					<span>Clone mode</span>
				</Button>
			</div>
		</div>

		<div class="refresh-modes-container">
			<Refresh on:click={refreshWallpapers} />
			<div class="mode-toggles">
				<ViewToggle bind:viewMode />
			</div>
		</div>
	</div>

	<div class="content-area">
		{#if showFilterPanel && installedFilters}
			<FilterPanel 
				config={installedFilters} 
				onSave={saveFilters} 
				onChange={handleFilterChange}
				onClose={() => (showFilterPanel = false)} 
			/>
		{/if}

		<div class="wallpaper-container">
			{#if loading}
				<div class="status-msg">Loading...</div>
			{:else if error}
				<div class="status-msg error">{error}</div>
			{:else if Object.keys(filteredWallpapers).length === 0}
				<div class="status-msg">No wallpapers found matching filters.</div>
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

	.toolbar {
		padding: 10px 15px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		background: var(--top-bar-bg);
		border-radius: 20px;
		gap: 15px;
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0;

		.left-actions {
			display: flex;
			flex: 1;
			justify-content: flex-start;
		}

		.status-info {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			gap: 15px 32px;
			font-size: 0.95em;
			flex: 0 1 auto;

			.status-item {
				display: flex;
				flex-wrap: wrap;
				gap: 10px;
				align-items: center;
				justify-content: center;

				.label {
					color: var(--text-muted);
					font-weight: 600;
					letter-spacing: 0.5px;
					font-size: 0.85em;
				}

				.value {
					color: var(--btn-primary-bg);
					font-weight: 700;
					text-transform: uppercase;
				}
			}
		}

		.refresh-modes-container {
			display: flex;
			flex: 1;
			justify-content: flex-end;
			gap: 8px;
		}

		.mode-toggles {
			display: flex;
			gap: 6px;
		}
	}

	.content-area {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		min-height: 0;
		overflow: hidden;
	}

	.wallpaper-container {
		flex-grow: 1;
		text-align: center;
		overflow-y: auto;
		position: relative;
		mask-image: linear-gradient(
			to bottom,
			transparent,
			black 20px,
			black 97%,
			transparent
		);

		.status-msg {
			padding: 40px;
			color: var(--text-muted);
			font-size: 1.1em;

			&.error {
				color: var(--error-color);
			}
		}
	}
</style>
