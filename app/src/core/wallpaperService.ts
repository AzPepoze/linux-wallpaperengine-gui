import * as wallpaperManager from "./wallpaperManager";
import type { WallpaperData } from "../types";
import * as Neutralino from "@neutralinojs/lib";

export async function killWallpaperEngineProcess(): Promise<{ success: boolean; error?: string }> {
	try {
		await Neutralino.os.execCommand(
			"kill $(ps aux | grep 'linux-wallpaperengine' | grep -v 'gui' | grep -v 'grep' | awk '{print $2}')"
		);
		return { success: true };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(`Error killing wallpaper engine process: ${error}`);
		return { success: false, error };
	}
}

export async function loadWallpapers() {
	let wallpapers: Record<string, WallpaperData> = {};
	let error: string | null = null;
	let initialWallpaper: { folderName: string } | null = null;

	try {
		await wallpaperManager.main();
		const result = await wallpaperManager.getWallpapers();

		if (result.success) {
			wallpapers = (result.wallpapers as Record<string, WallpaperData>) || {};
			const config = await wallpaperManager.getConfig();

			if (config.success && config.screens && config.screens.length > 0) {
				const firstScreenConfig = config.screens[0];
				if (firstScreenConfig.wallpaper) {
					const wallpaperData = wallpapers[firstScreenConfig.wallpaper];
					if (wallpaperData) {
						initialWallpaper = { ...wallpaperData, folderName: firstScreenConfig.wallpaper };
					}
				}
			}
			await wallpaperManager.manageWallpaper();
		} else {
			error = result.error || "Unknown error";
		}
	} catch (e: any) {
		error = e.message || String(e);
		console.error(e);
	}

	return { wallpapers, error, selectedWallpaper: initialWallpaper };
}
