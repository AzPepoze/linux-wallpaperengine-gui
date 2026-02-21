import type { WorkshopItem } from "../workshopHelper";
import type { WallpaperData } from "../../../shared/types";

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
 * Converts an array of WorkshopItems to a WallpaperData record
 */
export function convertWorkshopItemsToWallpaperRecord(
	items: WorkshopItem[],
): Record<string, WallpaperData> {
	const record: Record<string, WallpaperData> = {};
	items.forEach((item) => {
		record[item.publishedFileId] =
			convertWorkshopItemToWallpaperData(item);
	});
	return record;
}
