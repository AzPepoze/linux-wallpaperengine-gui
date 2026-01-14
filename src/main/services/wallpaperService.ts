import { ipcMain } from "electron";
import {
     applyWallpapers,
     setWallpaper,
     toggleCloneMode,
     clearAllWallpapers,
     loadWallpapers,
     getWallpaperProperties,
     saveWallpaperProperty,
} from "../../backend/wallpaperService";
import { getWallpaperPreview, getWallpaperProjectData } from "../../backend/wallpaperData";
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

     ipcMain.handle("get-wallpaper-project-data", async (_, id: string) => {
          logger.ipcReceived("get-wallpaper-project-data", id);
          return await getWallpaperProjectData(id);
     });

     ipcMain.handle("get-wallpaper-properties", async (_, id: string) => {
          logger.ipcReceived("get-wallpaper-properties", id);
          return await getWallpaperProperties(id);
     });

     ipcMain.handle(
          "save-wallpaper-property",
          async (_, id: string, key: string, value: string) => {
               logger.ipcReceived("save-wallpaper-property", id, key, value);
               return await saveWallpaperProperty(id, key, value);
          }
     );
}
