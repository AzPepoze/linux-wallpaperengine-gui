import * as wallpaperManager from "./wallpaperManager";
import type { WallpaperData } from "../shared/types";
import { logGui } from "./logger";

export async function killWallpaperEngineProcess(): Promise<{
     success: boolean;
     error?: string;
}> {
     try {
          await window.electronAPI.execCommand(
               "killall -e linux-wallpaperengine"
          );
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
}

export async function loadWallpapers() {
     let wallpapers: Record<string, WallpaperData> = {};
     let error: string | null = null;
     let initialWallpaper: { folderName: string } | null = null;

     try {
          await killWallpaperEngineProcess();
          await wallpaperManager.main();
          const result = await wallpaperManager.getWallpapers();

          if (result.success) {
               wallpapers =
                    (result.wallpapers as Record<string, WallpaperData>) || {};
               const config = await wallpaperManager.getConfig();

               if (
                    config.success &&
                    config.screens &&
                    config.screens.length > 0
               ) {
                    const firstScreenConfig = config.screens[0];
                    if (firstScreenConfig.wallpaper) {
                         const wallpaperData =
                              wallpapers[firstScreenConfig.wallpaper];
                         if (wallpaperData) {
                              initialWallpaper = {
                                   ...wallpaperData,
                                   folderName: firstScreenConfig.wallpaper,
                              };
                         }
                    }
               }
               await wallpaperManager.manageWallpaper();
          } else {
               error = result.error || "Unknown error";
          }
     } catch (e: any) {
          error = e.message || String(e);
          if (error) logGui(error);
     }

     return { wallpapers, error, selectedWallpaper: initialWallpaper };
}
