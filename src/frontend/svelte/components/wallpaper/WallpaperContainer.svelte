<script lang="ts">
	import DisplayIcon from '../../icons/DisplayIcon.svelte';
	import ApplyAllIcon from '../../icons/ApplyAllIcon.svelte';
	import PlaylistIcon from '../../icons/PlaylistIcon.svelte';
	import Button from '../ui/Button.svelte';
	import ViewToggle from '../ui/ViewToggle.svelte';
	import Refresh from '../ui/Refresh.svelte';

	import { showDisplayManager, showPlaylistManager } from '../../scripts/ui';
	import { settingsStore } from '../../scripts/settings';
	import { cloneMode, toggleCloneMode } from '../../scripts/display';
	import { get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
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

	// To support highlighting items in the selected playlist
	let playlists: Playlist[] = [];
	$: activePlaylist = playlists.find(
		(p) => p.name === $settingsStore?.playlist
	);

	onMount(async () => {
		await loadPlaylists();
	});

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

	<div class="wallpaper-container">
		{#if loading}
			<div class="status-msg">Loading...</div>
		{:else if error}
			<div class="status-msg error">{error}</div>
		{:else if Object.keys(wallpapers).length === 0}
			<div class="status-msg">No wallpapers found.</div>
		{:else if viewMode === 'grid'}
			<WallpaperItemGrid
				{wallpapers}
				{selectedWallpaper}
				{activePlaylist}
				onSelect={selectWallpaper}
			/>
		{:else}
			<WallpaperItemList
				{wallpapers}
				{selectedWallpaper}
				{activePlaylist}
				onSelect={selectWallpaper}
			/>
		{/if}
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

	.wallpaper-container {
		flex-grow: 1;
		text-align: center;
		overflow-y: auto;
		width: 100%;
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
