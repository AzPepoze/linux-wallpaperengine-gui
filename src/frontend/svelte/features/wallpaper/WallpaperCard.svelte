<script lang="ts">
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';
	import {
		isWallpaperFolderExist,
		getDownloadState,
		downloadStatus,
		subscribe,
		unsubscribe
	} from '@/features/workshop/scripts/workshop';
	import { onMount } from 'svelte';
	import WallpaperCardGrid from './WallpaperCardGrid.svelte';
	import WallpaperCardList from './WallpaperCardList.svelte';
	import { showContextMenu, hideContextMenu, contextMenuStore } from '@/core/contextMenuStore';
	import { showToast } from '@/core/toastStore';
	import { logger } from '@/core/logger';
	import { getWallpaperFolder } from '@/core/utils/workshopHelper';
	import { openFolderPath } from '@/features/wallpaper/scripts/openFolder';
	import { get } from 'svelte/store';
	import { screens } from '@/features/home/scripts/display';
	import { previewingWallpaperId, startWallpaperPreview, stopWallpaperPreview } from '@/features/wallpaper/scripts/preview';
	import { applyWallpaper } from '@/features/wallpaper/scripts/applyWallpaper';
	import { settingsStore } from '@/features/settings/scripts/settings';

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
	$: isWorkshopItem = !!wallpaper.projectData?.isWorkshop || isWorkshop;

	const downloadState = getDownloadState(folderName);
	$: ({ isSubscribed, isDownloaded, isDownloading, percent } = $downloadState);

	onMount(() => {
		if (
			(isWorkshop || isWorkshopItem) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}
	});

	function handleSelect() {
		onSelect(folderName, wallpaper);
	}

	function handleDoubleClick() {
		if (!$settingsStore?.doubleClickApply) return;
		if (isWorkshopItem && !isDownloaded) return;
		applyWallpaper(folderName);
	}

	async function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (get(contextMenuStore).visible) {
			hideContextMenu();
			return;
		}

		const isDownloadedItem = !isWorkshopItem || isDownloaded;
		let menuItems: any[] = [];

		if (isDownloadedItem) {
			const allScreens = Object.keys(get(screens));
			if (allScreens.length > 1) {
				menuItems.push({
					label: 'Apply Wallpaper',
					icon: 'desktop_windows',
					action: () => applyWallpaper(folderName)
				});
				menuItems.push({
					label: 'Apply to Display',
					icon: 'display_settings',
					subMenu: allScreens.map((scr) => ({
						label: scr,
						icon: 'desktop_windows',
						action: () => applyWallpaper(folderName, scr)
					}))
				});
			} else {
				menuItems.push({
					label: 'Apply Wallpaper',
					icon: 'desktop_windows',
					action: () => applyWallpaper(folderName)
				});
			}

			let playlists: any[] = [];
			try {
				const res = await window.electronAPI.getPlaylists();
				if (res?.success && Array.isArray(res.playlists)) {
					playlists = res.playlists;
				}
			} catch (err) {
				logger.error('Failed to load playlists for context menu:', err);
			}

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
			}

			menuItems.push({
				label: get(previewingWallpaperId) === folderName ? 'Stop Live Preview' : 'Live Preview (Window)',
				icon: get(previewingWallpaperId) === folderName ? 'stop' : 'open_in_browser',
				action: () => {
					if (get(previewingWallpaperId) === folderName) {
						stopWallpaperPreview();
					} else {
						startWallpaperPreview(folderName);
					}
				}
			});

			menuItems.push({ divider: true });

			menuItems.push({
				label: 'Open Folder Location',
				icon: 'folder_open',
				action: async () => {
					const basePath = await window.electronAPI.getWallpaperBasePath();
					await openFolderPath(getWallpaperFolder(folderName, wallpaper.folderPath, basePath));
				}
			});

			menuItems.push({
				label: 'Copy File Path',
				icon: 'content_copy',
				action: async () => {
					const basePath = await window.electronAPI.getWallpaperBasePath();
					navigator.clipboard.writeText(getWallpaperFolder(folderName, wallpaper.folderPath, basePath));
					showToast('Path copied to clipboard', 'info');
				}
			});

			if (isWorkshopItem) {
				menuItems.push({
					label: 'Copy Workshop Link',
					icon: 'link',
					action: () => {
						navigator.clipboard.writeText(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
						showToast('Workshop URL copied to clipboard', 'info');
					}
				});
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
		} else if (isDownloading) {
			menuItems.push({
				label: percent > 0 ? `Downloading (${percent}%)` : 'Downloading...',
				icon: 'downloading',
				disabled: true
			});
			menuItems.push({
				label: 'View Details',
				icon: 'visibility',
				action: handleSelect
			});
			menuItems.push({ divider: true });
			menuItems.push({
				label: 'Copy Workshop Link',
				icon: 'link',
				action: () => {
					navigator.clipboard.writeText(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
					showToast('Workshop URL copied to clipboard', 'info');
				}
			});
			menuItems.push({
				label: 'View Workshop Page',
				icon: 'open_in_new',
				action: () => {
					window.electronAPI.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
				}
			});
			menuItems.push({ divider: true });
			menuItems.push({
				label: 'Cancel & Unsubscribe',
				icon: 'delete',
				danger: true,
				action: () => {
					unsubscribe(folderName);
					showToast('Subscription cancelled', 'info');
				}
			});
		} else {
			menuItems.push({
				label: 'Subscribe',
				icon: 'file_download',
				action: async () => {
					try {
						await subscribe(folderName);
						showToast('Subscribed! Starting download...', 'info');
					} catch (err) {
						logger.error(`Failed to subscribe to ${folderName}:`, err);
						showToast('Failed to subscribe to workshop item', 'error');
					}
				}
			});
			menuItems.push({
				label: 'View Details',
				icon: 'visibility',
				action: handleSelect
			});
			menuItems.push({ divider: true });
			menuItems.push({
				label: 'Copy Workshop Link',
				icon: 'link',
				action: () => {
					navigator.clipboard.writeText(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
					showToast('Workshop URL copied to clipboard', 'info');
				}
			});
			menuItems.push({
				label: 'Copy Workshop ID',
				icon: 'tag',
				action: () => {
					navigator.clipboard.writeText(folderName);
					showToast('Workshop ID copied to clipboard', 'info');
				}
			});
			menuItems.push({ divider: true });
			menuItems.push({
				label: 'View Workshop Page',
				icon: 'open_in_new',
				action: () => {
					window.electronAPI.openExternal(`https://steamcommunity.com/sharedfiles/filedetails/?id=${folderName}`);
				}
			});
		}

		const title = wallpaper.projectData?.title || folderName;
		showContextMenu(e.clientX, e.clientY, menuItems, title);
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
		{handleDoubleClick}
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
		{index}
		{handleSelect}
		{handleContextMenu}
		{handleDoubleClick}
	/>
{/if}