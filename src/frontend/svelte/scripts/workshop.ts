import { writable, get } from 'svelte/store';
import { logger } from './logger';

export interface ProgressInfo {
	current: number;
	total: number;
}

export const downloadProgress = writable<Record<string, ProgressInfo>>({});
export const downloadStatus = writable<Record<string, boolean>>({});
export const downloadingMetadata = writable<Record<string, any>>({});
export const subscribedIds = writable<Set<string>>(new Set());

let cachedBasePath: string | null = null;

async function getBasePath(): Promise<string | null> {
	if (cachedBasePath) return cachedBasePath;
	cachedBasePath = await window.electronAPI.getWallpaperBasePath();
	return cachedBasePath;
}

async function fetchMetadataForId(fileId: string) {
	try {
		const details = await window.electronAPI.getPublishedFileDetails([fileId]);
		if (details && details.length > 0) {
			const it = details[0];
			downloadingMetadata.update((m) => ({
				...m,
				[fileId]: {
					folderName: fileId,
					projectData: {
						title: it.title,
						isWorkshop: true,
						workshopid: fileId,
						preview: it.preview_url,
						tags: it.tags || []
					},
					previewPath: it.preview_url
				}
			}));
			return true;
		}
	} catch (e) {
		logger.error(`Failed metadata fetch for ${fileId}:`, e);
	}
	return false;
}

export async function isDownloaded(folderName: string): Promise<boolean> {
	// Check cache first
	const status = get(downloadStatus);
	if (status[folderName] !== undefined) {
		return status[folderName];
	}

	try {
		const basePath = await getBasePath();
		if (!basePath) return false;

		const exists = await window.electronAPI.fsExists(`${basePath}/${folderName}`);

		// Update cache
		downloadStatus.update(s => ({ ...s, [folderName]: exists }));
		return exists;
	} catch (error) {
		logger.error('Error checking if downloaded:', error);
		return false;
	}
}

export async function subscribe(fileId: string) {
	// Prevent multiple subscriptions for the same item if already downloading
	if (get(downloadProgress)[fileId]) return;

	downloadProgress.update((p) => ({
		...p,
		[fileId]: { current: 0, total: 0 }
	}));
	downloadStatus.update((s) => ({ ...s, [fileId]: false }));

	// Fetch metadata immediately so it shows on Home page
	fetchMetadataForId(fileId);

	try {
		await window.electronAPI.subscribeWorkshopItem(fileId);
	} catch (error) {
		// Rollback UI state on failure
		logger.error('Error subscribing:', error);
		downloadProgress.update(p => {
			const newP = { ...p };
			delete newP[fileId];
			return newP;
		});
		downloadStatus.update(s => ({ ...s, [fileId]: false }));
		throw error;
	}
}

/**
 * Unsubscribes from a workshop item immediately.
 */
export async function unsubscribe(fileId: string) {
	try {
		logger.backend(`Unsubscribing from item ${fileId}`);

		// 1. Kill the wallpaper process
		try {
			await window.electronAPI.killWallpaper({ folderName: fileId });
		} catch (e) {
			logger.error(`Failed to kill wallpaper ${fileId}:`, e);
		}

		// 2. Unsubscribe via Steam
		await window.electronAPI.unsubscribeWorkshopItem(fileId);

		// 3. Update local stores immediately
		downloadStatus.update((s) => ({ ...s, [fileId]: false }));
		subscribedIds.update((s) => {
			const newSet = new Set(s);
			newSet.delete(fileId);
			return newSet;
		});

		logger.backend(`Successfully unsubscribed from ${fileId}`);
	} catch (error) {
		logger.error('Error during unsubscribe:', error);
	}
}

// Global poller for all downloads
let globalDownloadInterval: any = null;
let isPolling = false;
const downloadMissingCount: Record<string, number> = {};
const MAX_MISSING_TICKS = 60; // 60 seconds grace period for queued items

export function startGlobalDownloadPolling() {
	if (globalDownloadInterval) return;

	globalDownloadInterval = setInterval(async () => {
		if (isPolling) return;
		isPolling = true;

		try {
			const isSteam = await window.electronAPI.isSteamRunning();
			if (!isSteam) {
				if (Object.keys(get(downloadProgress)).length > 0) {
					logger.backend('Steam stopped running, clearing download progress');
					downloadProgress.set({});
				}
				isPolling = false;
				return;
			}

			// Refresh subscribed IDs from Steam
			const steamSubscribed = await window.electronAPI.getSubscribedItems();
			subscribedIds.set(new Set(steamSubscribed));

			// Track subscribed items that aren't downloaded yet
			const basePath = await getBasePath();
			for (const fileId of steamSubscribed) {
				if (!get(downloadProgress)[fileId]) {
					const exists = basePath ? await window.electronAPI.fsExists(`${basePath}/${fileId}`) : false;
					if (!exists) {
						downloadProgress.update((p) => ({
							...p,
							[fileId]: { current: 0, total: 0 }
						}));
					}
				}
			}

			const downloading =
				await window.electronAPI.getAllDownloadingItems();

			const currentMetadata = get(downloadingMetadata);
			const currentProgress = get(downloadProgress);
			const newProgress: Record<string, ProgressInfo> = {
				...currentProgress
			};
			const newMetadata = { ...currentMetadata };

			let metadataChanged = false;
			const activeSteamIds = new Set<string>();

			// Heartbeat for debugging
			const trackedCount = Object.keys(currentProgress).length;
			if (trackedCount > 0) {
				logger.backend(`Polling ${trackedCount} downloads. Steam active: ${downloading.length}`);
			}

			// Update progress and metadata for all currently downloading items reported by Steam
			for (const item of downloading) {
				const fileId = item.fileId;
				activeSteamIds.add(fileId);
				downloadMissingCount[fileId] = 0; // Reset missing count

				newProgress[fileId] = {
					current: parseInt(item.current),
					total: parseInt(item.total)
				};
			}

			// Handle completion, missing items, and delayed metadata for ALL tracked items
			for (const fileId of Object.keys(newProgress)) {
				// Fetch metadata if still missing (for items queued at 0%)
				if (!newMetadata[fileId]) {
					if (await fetchMetadataForId(fileId)) {
						metadataChanged = true;
						// Update our local copy for the rest of this loop
						newMetadata[fileId] = get(downloadingMetadata)[fileId];
					}
				}

				// 1. Proactive FS Check - PRIORITY
				if (basePath) {
					const exists = await window.electronAPI.fsExists(`${basePath}/${fileId}`);
					if (exists) {
						logger.backend(`Download finished for item ${fileId} (Found on disk)`);
						downloadStatus.update((s) => ({ ...s, [fileId]: true }));

						delete newProgress[fileId];
						delete newMetadata[fileId];
						delete downloadMissingCount[fileId];
						metadataChanged = true;
						continue;
					}
				}

				// 2. Handle missing from Steam (Grace Period)
				if (!activeSteamIds.has(fileId)) {
					downloadMissingCount[fileId] = (downloadMissingCount[fileId] || 0) + 1;

					if (downloadMissingCount[fileId] >= MAX_MISSING_TICKS) {
						logger.warn(`Download ${fileId} missing from Steam and FS for ${MAX_MISSING_TICKS}s. Removing.`);
						delete newProgress[fileId];
						delete newMetadata[fileId];
						delete downloadMissingCount[fileId];
						metadataChanged = true;
					}
				}
			}

			if (metadataChanged) {
				downloadingMetadata.set(newMetadata);
			}

			downloadProgress.set(newProgress);
		} catch (error) {
			logger.error('Error polling global downloads:', error);
		} finally {
			isPolling = false;
		}
	}, 1000);
}

// Start polling immediately when this module is loaded
if (typeof window !== 'undefined' && window.electronAPI) {
	startGlobalDownloadPolling();
}
