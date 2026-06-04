<script lang="ts">
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';
	import {
		isWallpaperFolderExist,
		getDownloadState,
		downloadStatus
	} from '@/features/workshop/scripts/workshop';
	import { onMount } from 'svelte';
	import WallpaperCardGrid from './WallpaperCardGrid.svelte';
	import WallpaperCardList from './WallpaperCardList.svelte';
	import { showContextMenu, hideContextMenu, contextMenuStore } from '@/core/contextMenuStore';
	import { unsubscribe } from '@/features/workshop/scripts/workshop';
	import { showToast } from '@/core/toastStore';
	import { get } from 'svelte/store';

	export let folderName: string;
	export let wallpaper: WallpaperData;
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
	export let index: number = 0;
	export let viewMode: 'grid' | 'list' = 'grid';

	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;
	$: isWorkshopItem = !!wallpaper.projectData?.isWorkshop;

	const downloadState = getDownloadState(folderName);
	$: ({ isSubscribed, isDownloaded, isDownloading, percent } = $downloadState);

	let playlists: any[] = [];

	onMount(async () => {
		if (
			(isWorkshop || isWorkshopItem) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}

		// Pre-fetch playlists for the context menu
		const res = await window.electronAPI.getPlaylists();
		if (res.success) {
			playlists = res.playlists;
		}
	});

	function handleSelect() {
		onSelect(folderName, wallpaper);
	}

	async function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (get(contextMenuStore).visible) {
			hideContextMenu();
			return;
		}

		let menuItems: any[] = [
			{
				label: 'Apply Wallpaper',
				icon: 'desktop_windows',
				action: handleSelect
			},
			{ divider: true }
		];

		if (playlists.length > 0) {
			menuItems.push({
				label: 'Add to Playlist',
				icon: 'playlist_add',
				subMenu: playlists.map((p) => ({
					label: p.name,
					icon: 'queue_music',
					action: async () => {
						const items = p.items || [];
						if (!items.includes(folderName)) {
							await window.electronAPI.updatePlaylistWallpapers(p.name, [...items, folderName]);
							showToast(`Added to ${p.name}`, 'info');
						} else {
							showToast(`Already in ${p.name}`, 'info');
						}
					}
				}))
			});
			menuItems.push({ divider: true });
		}

		menuItems.push({
			label: 'Open Folder Location',
			icon: 'folder_open',
			action: async () => {
				const basePath = await window.electronAPI.getWallpaperBasePath();
				await window.electronAPI.openPath(`${basePath}/${folderName}`);
			}
		});

		menuItems.push({
			label: 'Copy File Path',
			icon: 'content_copy',
			action: async () => {
				const basePath = await window.electronAPI.getWallpaperBasePath();
				navigator.clipboard.writeText(`${basePath}/${folderName}`);
				showToast('Path copied to clipboard', 'info');
			}
		});

		if (isWorkshopItem) {
			menuItems.push({ divider: true });
			menuItems.push({
				label: 'View Workshop Page',
				icon: 'open_in_new',
				action: () => {
					window.electronAPI.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
				}
			});
			menuItems.push({
				label: 'Unsubscribe',
				icon: 'delete',
				danger: true,
				action: () => {
					unsubscribe(folderName);
					showToast('Unsubscribed', 'info');
				}
			});
		}

		showContextMenu(e.clientX, e.clientY, menuItems);
	}
</script>

{#if viewMode === 'grid'}
	<WallpaperCardGrid
		{folderName}
		{wallpaper}
		{selected}
		{inPlaylist}
		{isWorkshopItem}
		{isSubscribed}
		{isDownloaded}
		{isDownloading}
		{percent}
		{isWorkshop}
		{index}
		{handleSelect}
		{handleContextMenu}
	/>
{:else}
	<WallpaperCardList
		{folderName}
		{wallpaper}
		{selected}
		{inPlaylist}
		{isWorkshopItem}
		{isSubscribed}
		{isDownloaded}
		{isDownloading}
		{percent}
		{isWorkshop}
		{handleSelect}
		{handleContextMenu}
	/>
{/if}