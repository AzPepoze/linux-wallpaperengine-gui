import { writable, get } from 'svelte/store';
import { logger } from './logger';

export interface ProgressInfo {
    current: number;
    total: number;
}

export const downloadProgress = writable<Record<string, ProgressInfo>>({});
export const downloadStatus = writable<Record<string, boolean>>({});


export async function isDownloaded(folderName: string): Promise<boolean> {
    // Check cache first
    const status = get(downloadStatus);
    if (status[folderName] !== undefined) {
        return status[folderName];
    }

    try {
        const basePath = await window.electronAPI.getWallpaperBasePath();
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

    try {
        await window.electronAPI.subscribeWorkshopItem(fileId);
        startPollingProgress(fileId);
    } catch (error) {
        logger.error('Error subscribing:', error);
        throw error;
    }
}

/**
 * Unsubscribes from a workshop item and updates local status.
 */
export async function unsubscribe(fileId: string) {
    try {
        await window.electronAPI.unsubscribeWorkshopItem(fileId);
        // Update local status store to indicate it's no longer downloaded
        downloadStatus.update(s => ({ ...s, [fileId]: false }));
        logger.backend(`Successfully unsubscribed from item ${fileId}`);
    } catch (error) {
        logger.error('Error unsubscribing:', error);
        throw error;
    }
}

function startPollingProgress(fileId: string) {
    const interval = setInterval(async () => {
        try {
            const info = await window.electronAPI.getWorkshopItemDownloadInfo(fileId);

            if (info) {
                const current = parseInt(info.current);
                const total = parseInt(info.total);

                downloadProgress.update(p => ({
                    ...p,
                    [fileId]: { current, total }
                }));

                if (current >= total && total > 0) {
                    finishDownload(fileId, interval);
                }
            } else {
                // If info is null, check if it's already on disk
                const downloaded = await isDownloaded(fileId);
                if (downloaded) {
                    finishDownload(fileId, interval);
                }
            }
        } catch (error) {
            logger.error('Error polling progress:', error);
        }
    }, 1000);
}

async function finishDownload(fileId: string, interval: any) {
    clearInterval(interval);

    downloadStatus.update(s => ({ ...s, [fileId]: true }));

    setTimeout(() => {
        downloadProgress.update(p => {
            const newP = { ...p };
            delete newP[fileId];
            return newP;
        });
    }, 2000);
}
