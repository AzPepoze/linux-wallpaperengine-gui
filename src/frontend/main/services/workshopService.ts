import { ipcMain, net } from "electron";
import { logger } from "../logger";
import { init } from "steamworks.js";
import { WALLPAPER_ENGINE_APP_ID } from "../../shared/constants";

// Cache for workshop images to avoid redundant fetches
const imageCache = new Map<string, string>();

export const STEAM_API_BASE = "https://api.steampowered.com";

export interface PublishedFileResponse {
	response: {
		total: number;
		publishedfiledetails: any[];
		next_cursor?: string;
	};
}

export interface QueryFilesRequest {
	key: string;
	query_type: number;
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
}

export function registerWorkshopService() {
	// Legacy: Get published file details by ID
	ipcMain.handle(
		"get-published-file-details",
		async (_, fileIds: string[]) => {
			logger.ipcReceived("get-published-file-details", fileIds);

			if (!fileIds || fileIds.length === 0) {
				return [];
			}

			try {
				const params = new URLSearchParams();
				params.append("itemcount", fileIds.length.toString());

				fileIds.forEach((id, index) => {
					params.append(`publishedfileids[${index}]`, id);
				});

				const response = await fetch(
					`${STEAM_API_BASE}/ISteamRemoteStorage/GetPublishedFileDetails/v1/`,
					{
						method: "POST",
						headers: {
							"Content-Type":
								"application/x-www-form-urlencoded",
						},
						body: params.toString(),
					},
				);

				if (!response.ok) {
					throw new Error(
						`Steam API error: ${response.statusText}`,
					);
				}

				const data: PublishedFileResponse = await response.json();
				return data.response?.publishedfiledetails || [];
			} catch (error) {
				logger.error(
					"Error fetching published file details:",
					error,
				);
				throw error;
			}
		},
	);

	// New: Query files with filters (tags, search, etc)
	ipcMain.handle(
		"query-workshop-files",
		async (_, steamApiKey: string, options: QueryFilesRequest) => {
			const tagsStr = options.requiredtags?.join(",") || "none";
			const cursor = options.cursor || "*";
			logger.ipcReceived("query-workshop-files", {
				tags: tagsStr,
				cursor: cursor,
			});

			if (!steamApiKey) {
				throw new Error("Steam API key is required");
			}

			try {
				const params = new URLSearchParams();
				params.append("key", steamApiKey);
				params.append(
					"query_type",
					(options.query_type || 13).toString(),
				);
				params.append("appid", WALLPAPER_ENGINE_APP_ID.toString());
				params.append(
					"creator_appid",
					WALLPAPER_ENGINE_APP_ID.toString(),
				);

				if (options.cursor) {
					params.append("cursor", options.cursor);
				} else {
					params.append("page", (options.page || 0).toString());
				}

				params.append(
					"numperpage",
					(options.numperpage || 10).toString(),
				);

				if (
					options.requiredtags &&
					options.requiredtags.length > 0
				) {
					options.requiredtags.forEach((tag, index) => {
						params.append(`requiredtags[${index}]`, tag);
					});
				}

				if (
					options.excludedtags &&
					options.excludedtags.length > 0
				) {
					options.excludedtags.forEach((tag, index) => {
						params.append(`excludedtags[${index}]`, tag);
					});
				}

				if (options.search_text) {
					params.append("search_text", options.search_text);
				}

				params.append(
					"match_all_tags",
					options.match_all_tags ? "true" : "false",
				);
				params.append("return_details", "true");
				params.append("return_tags", "true");
				params.append("return_previews", "true");

				const response = await fetch(
					`${STEAM_API_BASE}/IPublishedFileService/QueryFiles/v1/?${params.toString()}`,
				);

				if (!response.ok) {
					throw new Error(
						`Steam API error: ${response.statusText}`,
					);
				}

				const data: PublishedFileResponse = await response.json();
				console.log(
					`Query (cursor=${cursor}): total=${data.response?.total || 0} items=${data.response?.publishedfiledetails?.length || 0} nextCursor=${!!data.response?.next_cursor}`,
				);
				return {
					items: data.response?.publishedfiledetails || [],
					total: data.response?.total || 0,
					nextCursor: data.response?.next_cursor,
				};
			} catch (error) {
				console.error("Error querying workshop files:", error);
				throw error;
			}
		},
	);

	ipcMain.handle(
		"get-collection-details",
		async (_, collectionIds: string[]) => {
			logger.ipcReceived("get-collection-details", collectionIds);

			if (!collectionIds || collectionIds.length === 0) {
				return [];
			}

			try {
				const params = new URLSearchParams();
				params.append(
					"collectioncount",
					collectionIds.length.toString(),
				);

				collectionIds.forEach((id, index) => {
					params.append(`publishedfileids[${index}]`, id);
				});

				const response = await fetch(
					`${STEAM_API_BASE}/ISteamRemoteStorage/GetCollectionDetails/v1/`,
					{
						method: "POST",
						headers: {
							"Content-Type":
								"application/x-www-form-urlencoded",
						},
						body: params.toString(),
					},
				);

				if (!response.ok) {
					throw new Error(
						`Steam API error: ${response.statusText}`,
					);
				}

				const data: PublishedFileResponse = await response.json();
				return data.response?.publishedfiledetails || [];
			} catch (error) {
				logger.error("Error fetching collection details:", error);
				throw error;
			}
		},
	);

	ipcMain.handle(
		"get-ugc-file-details",
		async (_, steamApiKey: string, ugcId: string, steamId?: string) => {
			logger.ipcReceived("get-ugc-file-details", ugcId);

			if (!steamApiKey || !ugcId) {
				throw new Error("Steam API key and UGC ID are required");
			}

			try {
				const params = new URLSearchParams();
				params.append("key", steamApiKey);
				params.append("ugcid", ugcId);
				params.append("appid", WALLPAPER_ENGINE_APP_ID.toString());

				if (steamId) {
					params.append("steamid", steamId);
				}

				const response = await fetch(
					`${STEAM_API_BASE}/ISteamRemoteStorage/GetUGCFileDetails/v1/?${params.toString()}`,
					{ method: "GET" },
				);

				if (!response.ok) {
					throw new Error(
						`Steam API error: ${response.statusText}`,
					);
				}

				const data: PublishedFileResponse = await response.json();
				return data.response?.publishedfiledetails?.[0] || null;
			} catch (error) {
				logger.error("Error fetching UGC file details:", error);
				throw error;
			}
		},
	);

	ipcMain.handle("fetch-image", async (_, url: string) => {
		logger.ipcReceived("fetch-image", url);

		// Check cache first
		if (imageCache.has(url)) {
			return imageCache.get(url);
		}

		const fetchWithRetry = async (
			targetUrl: string,
			retries = 3,
			delay = 1000,
		) => {
			for (let i = 0; i < retries; i++) {
				try {
					// Using net.fetch which is Electron's own fetch,
					// more reliable and respects system proxy settings
					const response = await net.fetch(targetUrl);
					if (!response.ok) {
						throw new Error(
							`HTTP error! status: ${response.status}`,
						);
					}

					const arrayBuffer = await response.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);
					const base64 = buffer.toString("base64");
					const mimeType =
						response.headers.get("content-type") ||
						"image/jpeg";
					const dataUrl = `data:${mimeType};base64,${base64}`;

					// Cache the result
					imageCache.set(url, dataUrl);
					// Limit cache size to 50 items
					if (imageCache.size > 50) {
						const firstKey = imageCache.keys().next().value;
						if (typeof firstKey === "string") {
							imageCache.delete(firstKey);
						}
					}

					return dataUrl;
				} catch (error) {
					if (i === retries - 1) throw error;
					logger.warn(
						`Fetch failed for ${targetUrl}, retrying (${i + 1}/${retries})...`,
						error,
					);
					await new Promise((resolve) =>
						setTimeout(resolve, delay * (i + 1)),
					);
				}
			}
		};

		try {
			return await fetchWithRetry(url);
		} catch (error) {
			logger.error("Error fetching image after retries:", error);
			throw error;
		}
	});

	// Steamworks: Subscribe to workshop item
	let steamworksClient: any = null;

	const getSteamworksClient = () => {
		if (steamworksClient) return steamworksClient;
		try {
			steamworksClient = init(WALLPAPER_ENGINE_APP_ID);
			logger.backend("Steamworks client initialized");
			return steamworksClient;
		} catch (e) {
			logger.error("Failed to initialize Steamworks client:", e);
			return null;
		}
	};

	ipcMain.handle("subscribe-workshop-item", async (_, fileId: string) => {
		logger.ipcReceived("subscribe-workshop-item", fileId);
		const client = getSteamworksClient();
		if (!client) {
			throw new Error(
				"Steamworks client not initialized. Make sure Steam is running.",
			);
		}

		try {
			await client.workshop.subscribe(BigInt(fileId));
			logger.backend(`Successfully subscribed to item ${fileId}`);
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
			throw new Error(
				"Steamworks client not initialized. Make sure Steam is running.",
			);
		}

		try {
			await client.workshop.unsubscribe(BigInt(fileId));
			logger.backend(`Successfully unsubscribed from item ${fileId}`);
			return { success: true };
		} catch (error) {
			logger.error(`Error unsubscribing from item ${fileId}:`, error);
			throw error;
		}
	});

	ipcMain.handle(
		"get-workshop-item-download-info",
		async (_, fileId: string) => {
			const client = getSteamworksClient();
			if (!client) return null;

			try {
				const info = client.workshop.getItemDownloadInfo(
					BigInt(fileId),
				);
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
}
