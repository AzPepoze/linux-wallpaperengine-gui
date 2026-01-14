import { ipcMain } from "electron";
import {
     applyWallpapers,
     setWallpaper,
     toggleCloneMode,
     clearAllWallpapers,
     loadWallpapers,
} from "../../backend/wallpaperService";
import { getWallpaperPreview } from "../../backend/wallpaperData";
import { logger } from "../../backend/logger";

export function registerWallpaperService() {
     ipcMain.handle("apply-wallpapers", async () => {
          logger.ipcReceived("apply-wallpapers");
          return await applyWallpapers();
     });

     ipcMain.handle(
          "set-wallpaper",
          async (_, screenName: string, wallpaperFolderName: string | null) => {
               logger.ipcReceived(
                    "set-wallpaper",
                    screenName,
                    wallpaperFolderName
               );
               return await setWallpaper(screenName, wallpaperFolderName);
          }
     );

     ipcMain.handle(
          "toggle-clone-mode",
          async (_, enabled: boolean, globalWallpaper?: string | null) => {
               logger.ipcReceived(
                    "toggle-clone-mode",
                    enabled,
                    globalWallpaper
               );
               return await toggleCloneMode(enabled, globalWallpaper);
          }
     );

     ipcMain.handle("clear-all-wallpapers", async () => {
          logger.ipcReceived("clear-all-wallpapers");
          return await clearAllWallpapers();
     });

     ipcMain.handle("load-wallpapers", async () => {
          logger.ipcReceived("load-wallpapers");
          return await loadWallpapers();
     });

     ipcMain.handle("get-wallpaper-preview", async (_, path: string) => {
          logger.ipcReceived("get-wallpaper-preview", path);
          return await getWallpaperPreview(path);
     });
}
