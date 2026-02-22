import { ipcMain } from "electron";
import { logger } from "../logger";
import { init } from "steamworks.js";
import { WALLPAPER_ENGINE_APP_ID } from "../../shared/constants";
import { socketClient } from "../socket-client";

export interface WorkshopQueryOptions {
	query_type?: number;
	page?: number;
	cursor?: string;
	numperpage?: number;
	requiredtags?: string[];
	excludedtags?: string[];
	match_all_tags?: boolean;
	search_text?: string;
	return_details?: boolean;
	return_tags?: boolean;
	return_previews?: boolean;
	item_type?: number;
}

export function registerWorkshopService() {
	let steamworksClient: any = null;

	const getSteamworksClient = () => {
		if (steamworksClient) return steamworksClient;
		try {
			steamworksClient = init(WALLPAPER_ENGINE_APP_ID);
			logger.backend("Steamworks client initialized successfully");
			return steamworksClient;
		} catch (e: any) {
			return null;
		}
	};

	ipcMain.handle("is-steam-running", async () => {
		return !!getSteamworksClient();
	});

	ipcMain.handle(
		"get-published-file-details",
		async (_, fileIds: string[]) => {
			logger.ipcReceived("get-published-file-details", fileIds);

			if (!fileIds || fileIds.length === 0) {
				return [];
			}

			const client = getSteamworksClient();
			if (!client) {
				throw new Error("Steamworks client not initialized");
			}

			try {
				const bigIntIds = fileIds.map(id => BigInt(id));
				const result = await client.workshop.getItems(bigIntIds, {
					includeMetadata: true,
					includeAdditionalPreviews: true
				});

				return (result?.items || []).filter((it: any) => it).map((it: any) => ({
					...it,
					publishedfileid: it.publishedFileId?.toString(),
					result: 1,
					image: it.previewUrl,
					preview_url: it.previewUrl,
					time_created: it.timeCreated,
					time_updated: it.timeUpdated,
					subscriptions: Number(it.statistics?.numSubscriptions || 0),
					favorites: Number(it.statistics?.numFavorites || 0),
					views: Number(it.statistics?.numUniqueWebsiteViews || 0),
				}));
			} catch (error) {
				logger.error("Error fetching published file details:", error);
				throw error;
			}
		},
	);

	ipcMain.handle(
		"query-workshop-files",
		async (_: any, options: WorkshopQueryOptions = {}) => {
			logger.ipcReceived("query-workshop-files", options);

			const client = getSteamworksClient();
			if (!client) {
				throw new Error("Steamworks client not initialized");
			}

			try {
				const page = options.page ?? 1;
				const requestedQueryType = options.query_type ?? 13;
				const requestedItemType = options.item_type ?? 13;

				const queryConfig: any = {
					requiredTags: options.requiredtags || undefined,
					excludedTags: options.excludedtags || undefined,
					matchAnyTag: options.match_all_tags === true ? false : true,
					searchText: options.search_text || undefined,
					includeMetadata: true,
					includeAdditionalPreviews: true,
					includeLongDescription: false,
					cachedResponseMaxAge: 0,
				};

				if (Array.isArray(queryConfig.requiredTags) && queryConfig.requiredTags.length > 3) {
					queryConfig.matchAnyTag = true;
				}

				let rawResult: any = null;

				const itemTypesToTry = [requestedItemType, 13, 0];
				const queryTypesToTry = Array.from(new Set([requestedQueryType, 13, 1, 2, 9]));

				let succeeded = false;
				for (const qt of queryTypesToTry) {
					for (const it of itemTypesToTry) {
						try {
							rawResult = await client.workshop.getAllItems(
								page,
								qt,
								it,
								WALLPAPER_ENGINE_APP_ID,
								WALLPAPER_ENGINE_APP_ID,
								queryConfig,
							);

							const hasResults = (rawResult?.items || []).length > 0 || (rawResult?.totalResults || 0) > 0;
							if (hasResults) {
								succeeded = true;
								break;
							}
						} catch (e: any) {
							logger.error(`getAllItems failed (queryType=${qt}, itemType=${it}):`, e?.message);
						}
					}
					if (succeeded) break;
				}

				const mappedItems = (rawResult?.items || []).filter((it: any) => it).map((it: any) => ({
					...it,
					publishedfileid: it.publishedFileId?.toString(),
					result: 1,
					image: it.previewUrl,
					preview_url: it.previewUrl,
					time_created: it.timeCreated,
					time_updated: it.timeUpdated,
					subscriptions: Number(it.statistics?.numSubscriptions || 0),
					favorites: Number(it.statistics?.numFavorites || 0),
					views: Number(it.statistics?.numUniqueWebsiteViews || 0),
				}));

				return {
					items: mappedItems,
					total: rawResult?.totalResults ?? mappedItems.length,
					nextCursor: null,
				};
			} catch (error: any) {
				return { items: [], total: 0, nextCursor: null, error: error?.message };
			}
		},
	);

	ipcMain.handle(
		"get-ugc-file-details",
		async (_, ugcId: string) => {
			logger.ipcReceived("get-ugc-file-details", ugcId);

			if (!ugcId) {
				throw new Error("UGC ID is required");
			}

			const client = getSteamworksClient();
			if (!client) {
				throw new Error("Steamworks client not initialized");
			}

			try {
				const it = await client.workshop.getItem(BigInt(ugcId), {
					includeMetadata: true,
					includeAdditionalPreviews: true,
					includeLongDescription: true
				});

				if (!it) return null;

				return {
					...it,
					publishedfileid: it.publishedFileId?.toString(),
					result: 1,
					image: it.previewUrl,
					preview_url: it.previewUrl,
					time_created: it.timeCreated,
					time_updated: it.timeUpdated,
					subscriptions: Number(it.statistics?.numSubscriptions || 0),
					favorites: Number(it.statistics?.numFavorites || 0),
					views: Number(it.statistics?.numUniqueWebsiteViews || 0),
					fileSize: Number(it.fileSize || it.file_size || 0),
					_raw: it,
				};
			} catch (error) {
				logger.error("Error fetching UGC file details:", error);
				throw error;
			}
		},
	);

	ipcMain.handle("subscribe-workshop-item", async (_, fileId: string) => {
		logger.ipcReceived("subscribe-workshop-item", fileId);
		const client = getSteamworksClient();
		if (!client) {
			throw new Error("Steamworks client not initialized");
		}

		try {
			await client.workshop.subscribe(BigInt(fileId));
			return { success: true };
		} catch (error) {
			logger.error(`Error subscribing to item ${fileId}:`, error);
			throw error;
		}
	});

	ipcMain.handle("unsubscribe-workshop-item", async (_, fileId: string) => {
		logger.ipcReceived("unsubscribe-workshop-item", fileId);
		const client = getSteamworksClient();
		if (!client) {
			throw new Error("Steamworks client not initialized");
		}

		try {
			// Kill the wallpaper before unsubscribing
			try {
				await socketClient.send("kill-wallpaper", { folderName: fileId });
			} catch (e: any) {
				logger.error(`Failed to kill wallpaper ${fileId} before unsubscription:`, e);
			}

			await client.workshop.unsubscribe(BigInt(fileId));
			return { success: true };
		} catch (error) {
			logger.error(`Error unsubscribing from item ${fileId}:`, error);
			throw error;
		}
	});

	ipcMain.handle("get-all-downloading-items", async () => {
		const client = getSteamworksClient();
		if (!client) return [];

		try {
			const subscribedItems = client.workshop.getSubscribedItems();
			const downloadingItems: any[] = [];

			for (const fileId of subscribedItems) {
				const state = client.workshop.state(fileId);
				// 16 = Downloading, 32 = Download Pending
				if ((state & 16) || (state & 32)) {
					const info = client.workshop.downloadInfo(fileId);
					if (info) {
						downloadingItems.push({
							fileId: fileId.toString(),
							current: info.current.toString(),
							total: info.total.toString(),
							state
						});
					}
				}
			}
			return downloadingItems;
		} catch (error) {
			logger.error("Error fetching all downloading items:", error);
			return [];
		}
	});

	ipcMain.handle("get-subscribed-items", async () => {
		const client = getSteamworksClient();
		if (!client) return [];

		try {
			const subscribedItems = client.workshop.getSubscribedItems();
			return subscribedItems.map((id: bigint) => id.toString());
		} catch (error) {
			logger.error("Error fetching subscribed items:", error);
			return [];
		}
	});

	ipcMain.handle(
		"get-workshop-item-download-info",
		async (_, fileId: string) => {
			const client = getSteamworksClient();
			if (!client) return null;

			try {
				const info = client.workshop.downloadInfo(BigInt(fileId));
				if (!info) return null;

				return {
					current: info.current.toString(),
					total: info.total.toString(),
				};
			} catch (error) {
				return null;
			}
		},
	);

	ipcMain.handle("get-workshop-item-install-info", async (_, fileId: string) => {
		const client = getSteamworksClient();
		if (!client) return null;

		try {
			const info = client.workshop.installInfo(BigInt(fileId));
			if (!info) return null;

			return {
				...info,
				sizeOnDisk: info.sizeOnDisk.toString(),
			};
		} catch (error) {
			return null;
		}
	});
}
