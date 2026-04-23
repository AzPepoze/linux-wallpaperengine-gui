import type { WorkshopItem } from "@/utils/workshopHelper";
import type { WallpaperData } from "@shared/types";

/**
 * Converts a WorkshopItem to WallpaperData format
 */
export function convertWorkshopItemToWallpaperData(
	item: WorkshopItem,
): WallpaperData {
	return {
		projectData: {
			// Spread all raw API data first
			...item,
			// Then explicitly set the fields we want to ensure are correct
			title: item.title,
			description: item.description,
			file: item.publishedFileId,
			preview: item.previewUrl || "",
			type: "workshop",
			tags: item.tags,
			approved: item.tags?.includes("Approved") || false, // This not work! but IDK how to get approval status just leave it for now
			workshopid: item.publishedFileId,
			views: item.views,
			subscriptions: item.subscriptions,
			isWorkshop: true,
			fileSize: item.fileSize,
			timeCreated: item.timeCreated,
			timeUpdated: item.timeUpdated,
			voteScore: item.voteScore,
		},
		previewPath: item.previewUrl,
	};
}

/**
 * Converts an array of WorkshopItems to an array of [id, WallpaperData] pairs to preserve order
 */
export function convertWorkshopItemsToWallpaperPairs(
	items: WorkshopItem[],
): [string, WallpaperData][] {
	return items.map((item) => [
		item.publishedFileId,
		convertWorkshopItemToWallpaperData(item),
	]);
}
