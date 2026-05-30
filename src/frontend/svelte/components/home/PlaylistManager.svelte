<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { settingsStore } from '@/scripts/settings/settings';
	import { showToast } from '@/scripts/shared/toastStore';
	import type { Playlist, WallpaperData } from '@shared/types';
	import PlaylistSettingsPanel from './PlaylistSettingsPanel.svelte';
	import PlaylistWallpapersPanel from './PlaylistWallpapersPanel.svelte';
	import { t } from '@/i18n';
	import {
		getPlaylistOptions,
		fetchPlaylists,
		startPlaylist,
		stopPlaylist,
		createPlaylist,
		renamePlaylist,
		deletePlaylist,
		updatePlaylistInterval,
		removePlaylistItem,
		parseWallpaperIdFromPath,
		toggleWallpaperInPlaylist
	} from './PlaylistManager.svelte.ts';

	export let wallpapers: Record<string, WallpaperData> = {};
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void = () => {};
	export let selectedWallpaperFolder: string | null = null;
	export let onPlaylistChange: () => void = () => {};
	export let selectedScreen: string | null = null;
	export let cloneMode: boolean = false;

	let playlists: Playlist[] = [];
	$: playlistOptions = [
		{ value: '', label: $t('playlist.settings.none') },
		{ value: 'Random All', label: $t('playlist.settings.randomAll') }
	];
	export let activePlaylist: Playlist | null = null;

	let isCreating = false;
	let isRenaming = false;
	let newPlaylistName = '';
	let tempInterval = 0;
	let saveTimeout: number | null = null;

	onMount(async () => {
		await loadPlaylists();
		initActivePlaylist();
	});

	async function loadPlaylists() {
		playlists = await fetchPlaylists();
		playlistOptions = getPlaylistOptions(playlists);
	}

	function initActivePlaylist() {
		if ($settingsStore && $settingsStore.playlist) {
			activePlaylist =
				playlists.find((p) => p.name === $settingsStore.playlist) ||
				null;
			if (activePlaylist) {
				tempInterval =
					$settingsStore.playlistInterval ||
					activePlaylist.settings.delay / 60;
			}
		}
	}

	async function handlePlaylistChange() {
		if ($settingsStore) {
			if (activePlaylist) {
				tempInterval = activePlaylist.settings.delay / 60;
				$settingsStore.playlistInterval = tempInterval;
			} else if ($settingsStore.playlist === 'Random All') {
				// Default interval for Random All if not set
				if (!$settingsStore.playlistInterval) {
					$settingsStore.playlistInterval = 1;
				}
				tempInterval = $settingsStore.playlistInterval;
			} else {
				$settingsStore.playlistInterval = 0;
			}

			await window.electronAPI.saveConfig($settingsStore);

			if (activePlaylist && activePlaylist.items.length > 0) {
				await startPlaylist(activePlaylist.name, tempInterval, cloneMode, selectedScreen);
				showToast(
					$t('playlist.messages.startedPlaylist', { display: cloneMode ? 'all displays' : selectedScreen || 'display', name: activePlaylist.name }),
					'success'
				);
			} else if ($settingsStore.playlist === 'Random All') {
				await startPlaylist('Random All', tempInterval, cloneMode, selectedScreen);
				showToast(
					$t('playlist.messages.startedRandom', { display: cloneMode ? 'all displays' : selectedScreen || 'display' }),
					'success'
				);
			} else {
				await stopPlaylist(cloneMode, selectedScreen);
			}
		}
	}

	async function createNewPlaylist() {
		if (!newPlaylistName.trim()) return;
		const success = await createPlaylist(newPlaylistName.trim());
		if (success) {
			await loadPlaylists();
			if ($settingsStore) {
				$settingsStore.playlist = newPlaylistName.trim();
				activePlaylist =
					playlists.find(
						(p) => p.name === newPlaylistName.trim()
					) || null;
				await handlePlaylistChange();
			}
			isCreating = false;
			newPlaylistName = '';
			showToast($t('playlist.messages.created'), 'success');
		}
	}

	async function handleRenamePlaylist() {
		if (!newPlaylistName.trim() || !activePlaylist) return;
		const success = await renamePlaylist(activePlaylist.name, newPlaylistName.trim());
		if (success) {
			if ($settingsStore) {
				$settingsStore.playlist = newPlaylistName.trim();
				await window.electronAPI.saveConfig($settingsStore);
			}
			await loadPlaylists();
			initActivePlaylist();
			isRenaming = false;
			newPlaylistName = '';
			showToast($t('playlist.messages.renamed'), 'success');
		}
	}

	async function handleDeletePlaylist() {
		if (!activePlaylist) return;
		const success = await deletePlaylist(activePlaylist.name);
		if (success) {
			if ($settingsStore) {
				$settingsStore.playlist = '';
				await handlePlaylistChange();
			}
			await loadPlaylists();
			activePlaylist = null;
			showToast($t('playlist.messages.deleted'), 'success');
		}
	}

	function handleIntervalInput() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = window.setTimeout(async () => {
			if (
				(activePlaylist ||
					$settingsStore?.playlist === 'Random All') &&
				$settingsStore
			) {
				$settingsStore.playlistInterval = tempInterval;
				await updatePlaylistInterval(
					activePlaylist?.name || 'Random All',
					tempInterval,
					cloneMode,
					selectedScreen
				);
			}
		}, 500);
	}

	async function removeItem(index: number) {
		if (!activePlaylist) return;
		const newItems = await removePlaylistItem(activePlaylist.name, activePlaylist.items, index);
		if (newItems) {
			activePlaylist.items = newItems;
			playlists = playlists.map((p) =>
				p.name === activePlaylist?.name
					? { ...p, items: newItems }
					: p
			);
			playlistOptions = getPlaylistOptions(playlists);
			onPlaylistChange();
			showToast($t('playlist.messages.itemRemoved'), 'success');
		}
	}

	function selectItem(itemPath: string) {
		const id = parseWallpaperIdFromPath(itemPath);
		if (id && wallpapers[id]) {
			onSelect(id, wallpapers[id]);
		}
	}

	$: if ($settingsStore?.playlist !== undefined) {
		const currentInStore = $settingsStore.playlist;
		if (activePlaylist?.name !== currentInStore) {
			activePlaylist =
				playlists.find((p) => p.name === currentInStore) || null;
			if (activePlaylist) {
				tempInterval =
					$settingsStore.playlistInterval ||
					activePlaylist.settings.delay / 60;
			} else if (currentInStore === 'Random All') {
				tempInterval = $settingsStore.playlistInterval || 1;
			}
		}
	}

	export async function addWallpaperToPlaylist(folderName: string) {
		if ($settingsStore?.playlist === 'Random All') {
			showToast($t('playlist.messages.cannotAddToRandom'), 'info');
			return;
		}
		if (!activePlaylist) {
			showToast($t('playlist.messages.selectPlaylistFirst'), 'info');
			return;
		}
		const wpInfo = wallpapers[folderName];
		if (!wpInfo) return;

		const newItems = await toggleWallpaperInPlaylist(activePlaylist, folderName, wpInfo);
		if (newItems) {
			activePlaylist.items = newItems;
			playlists = playlists.map((p) =>
				p.name === activePlaylist?.name
					? { ...p, items: newItems }
					: p
			);
			playlistOptions = getPlaylistOptions(playlists);
			onPlaylistChange();
		}
	}
</script>

<div
	class="playlist-manager"
	in:fly={{ y: -20, duration: 300 }}
	out:fly={{ y: -20, duration: 300 }}
>
	<PlaylistSettingsPanel
		{playlistOptions}
		{activePlaylist}
		bind:tempInterval
		bind:isCreating
		bind:isRenaming
		bind:newPlaylistName
		onCreate={createNewPlaylist}
		onRename={handleRenamePlaylist}
		onDelete={handleDeletePlaylist}
		onCancel={() => {
			isCreating = false;
			isRenaming = false;
			newPlaylistName = '';
		}}
		onChange={handlePlaylistChange}
		onIntervalInput={handleIntervalInput}
		startCreating={() => (isCreating = true)}
		startRenaming={() => {
			isRenaming = true;
			newPlaylistName = activePlaylist?.name || '';
		}}
	/>

	<PlaylistWallpapersPanel
		{activePlaylist}
		{wallpapers}
		{selectedWallpaperFolder}
		onRemove={removeItem}
		onSelect={selectItem}
	/>
</div>

<style lang="scss">
	.playlist-manager {
		display: flex;
		gap: 20px;
		padding: 0 20px 20px 20px;
		margin-bottom: 20px;
		min-height: 240px;
		overflow: hidden;
		transition: max-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
</style>
