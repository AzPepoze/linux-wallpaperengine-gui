<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { settingsStore, showToast } from '../../scripts/settings';
	import type { Playlist, WallpaperData } from '../../../shared/types';
	import PlaylistSettingsPanel from './PlaylistSettingsPanel.svelte';
	import PlaylistWallpapersPanel from './PlaylistWallpapersPanel.svelte';

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
	let playlistOptions: { value: string; label: string }[] = [];
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
		try {
			const result = await window.electronAPI.getPlaylists();
			if (result.success && result.playlists) {
				playlists = result.playlists;
				updateOptions();
			}
		} catch (err) {
			console.error('Failed to load playlists:', err);
		}
	}

	function updateOptions() {
		playlistOptions = [
			{ value: '', label: 'None (All Wallpapers)' },
			...playlists.map((p) => ({
				value: p.name,
				label: `${p.name} (${p.items.length} items)`
			}))
		];
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
			activePlaylist =
				playlists.find((p) => p.name === $settingsStore.playlist) ||
				null;

			if (activePlaylist) {
				tempInterval = activePlaylist.settings.delay / 60;
				$settingsStore.playlistInterval = tempInterval;
			} else {
				$settingsStore.playlistInterval = 0;
			}

			await window.electronAPI.saveConfig($settingsStore);

			const screenName = cloneMode ? 'Global' : selectedScreen || '';
			if (activePlaylist && activePlaylist.items.length > 0) {
				await window.electronAPI.startPlaylist(
					activePlaylist.name,
					tempInterval,
					screenName
				);
				showToast(
					`Started playlist on ${cloneMode ? 'all displays' : selectedScreen || 'display'}: ${activePlaylist.name}`,
					'success'
				);
			} else {
				await window.electronAPI.stopPlaylist(screenName);
			}
		}
	}

	async function createNewPlaylist() {
		if (!newPlaylistName.trim()) return;
		try {
			await window.electronAPI.createPlaylist(newPlaylistName.trim());
			await loadPlaylists();
			if ($settingsStore) {
				$settingsStore.playlist = newPlaylistName.trim();
				await handlePlaylistChange();
			}
			isCreating = false;
			newPlaylistName = '';
			showToast('Playlist created', 'success');
		} catch (e) {
			showToast('Failed to create playlist', 'error');
		}
	}

	async function renamePlaylist() {
		if (!newPlaylistName.trim() || !activePlaylist) return;
		try {
			await window.electronAPI.renamePlaylist(
				activePlaylist.name,
				newPlaylistName.trim()
			);
			if ($settingsStore) {
				$settingsStore.playlist = newPlaylistName.trim();
				await window.electronAPI.saveConfig($settingsStore);
			}
			await loadPlaylists();
			initActivePlaylist();
			isRenaming = false;
			newPlaylistName = '';
			showToast('Playlist renamed', 'success');
		} catch (e) {
			showToast('Failed to rename playlist', 'error');
		}
	}

	async function deletePlaylist() {
		if (!activePlaylist) return;
		try {
			await window.electronAPI.deletePlaylist(activePlaylist.name);
			if ($settingsStore) {
				$settingsStore.playlist = '';
				await handlePlaylistChange();
			}
			await loadPlaylists();
			activePlaylist = null;
			showToast('Playlist deleted', 'success');
		} catch (e) {
			showToast('Failed to delete playlist', 'error');
		}
	}

	function handleIntervalInput() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = window.setTimeout(async () => {
			if (activePlaylist && $settingsStore) {
				$settingsStore.playlistInterval = tempInterval;
				await window.electronAPI.saveConfig($settingsStore);
				const screenName = cloneMode
					? 'Global'
					: selectedScreen || '';
				await window.electronAPI.updatePlaylistInterval(
					activePlaylist.name,
					tempInterval,
					screenName
				);
			}
		}, 500);
	}

	async function removeItem(index: number) {
		if (!activePlaylist) return;
		const newItems = [...activePlaylist.items];
		newItems.splice(index, 1);
		try {
			await window.electronAPI.updatePlaylistWallpapers(
				activePlaylist.name,
				newItems
			);
			activePlaylist.items = newItems;
			playlists = playlists.map((p) =>
				p.name === activePlaylist?.name
					? { ...p, items: newItems }
					: p
			);
			updateOptions();
			onPlaylistChange();
		} catch (e) {
			showToast('Failed to remove item', 'error');
		}
	}

	function selectItem(itemPath: string) {
		const match = itemPath.match(/431960[\/\\](\d+)[\/\\]/);
		if (match && match[1]) {
			const id = match[1];
			if (wallpapers[id]) {
				onSelect(id, wallpapers[id]);
			}
		}
	}

	$: if ($settingsStore?.playlist !== undefined && playlists.length > 0) {
		const currentInStore = $settingsStore.playlist;
		if (activePlaylist?.name !== currentInStore) {
			activePlaylist =
				playlists.find((p) => p.name === currentInStore) || null;
			if (activePlaylist) {
				tempInterval =
					$settingsStore.playlistInterval ||
					activePlaylist.settings.delay / 60;
			}
		}
	}

	export async function addWallpaperToPlaylist(folderName: string) {
		if (!activePlaylist) {
			showToast('Select a playlist to add wallpapers', 'info');
			return;
		}
		const wpInfo = wallpapers[folderName];
		if (!wpInfo || !wpInfo.projectData) return;

		try {
			const basePath = await window.electronAPI.getWallpaperBasePath();
			if (!basePath) {
				showToast(
					'Could not determine wallpaper directory',
					'error'
				);
				return;
			}

			const normalizedBase = basePath
				.replace(/[\/]+$/, '')
				.replace(/\\/g, '/');
			const rawFile = wpInfo.projectData.file;
			const wallpaperFile =
				rawFile === 'scene.json' ? 'scene.pkg' : rawFile;
			const itemPath = `Z:${normalizedBase}/${folderName}/${wallpaperFile}`;

			let newItems: string[];
			const alreadyIn = activePlaylist.items.some((p) =>
				p.includes(`/${folderName}/`)
			);
			if (!alreadyIn) {
				newItems = [...activePlaylist.items, itemPath];
				showToast(`Added to ${activePlaylist.name}`, 'success');
			} else {
				newItems = activePlaylist.items.filter(
					(path) => !path.includes(`/${folderName}/`)
				);
				showToast(`Removed from ${activePlaylist.name}`, 'info');
			}

			await window.electronAPI.updatePlaylistWallpapers(
				activePlaylist.name,
				newItems
			);
			activePlaylist.items = newItems;
			playlists = playlists.map((p) =>
				p.name === activePlaylist?.name
					? { ...p, items: newItems }
					: p
			);
			updateOptions();
			onPlaylistChange();
		} catch (err) {
			console.error('Failed to add wallpaper:', err);
			showToast('Failed to update playlist', 'error');
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
		onRename={renamePlaylist}
		onDelete={deletePlaylist}
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
