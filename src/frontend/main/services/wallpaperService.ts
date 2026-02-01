import { ipcMain } from "electron";
import { socketClient } from "../socket-client";
import { logger } from "../logger";
import {
     getConfig,
     updateScreenConfig,
     updateConfig,
     updateWallpaperProperties,
} from "../utils/configHelper";

export function registerWallpaperService() {
     ipcMain.handle("apply-wallpapers", async () => {
          logger.ipcReceived("apply-wallpapers");
          return await socketClient.send("apply-wallpapers");
     });

     ipcMain.handle(
          "set-wallpaper",
          async (_, screenName: string, wallpaperFolderName: string | null) => {
               logger.ipcReceived(
                    "set-wallpaper",
                    screenName,
                    wallpaperFolderName,
               );
               await updateScreenConfig(screenName, wallpaperFolderName);
               const config = await getConfig();
               if (config.cloneMode) {
                    await updateConfig({
                         globalWallpaper: wallpaperFolderName,
                    });
               }
               return await socketClient.send("apply-wallpapers");
          },
     );

     ipcMain.handle(
          "toggle-clone-mode",
          async (_, enabled: boolean, globalWallpaper?: string | null) => {
               logger.ipcReceived(
                    "toggle-clone-mode",
                    enabled,
                    globalWallpaper,
               );
               const updateData: any = { cloneMode: enabled };
               if (globalWallpaper !== undefined) {
                    updateData.globalWallpaper = globalWallpaper;
               }
               await updateConfig(updateData);
               return await socketClient.send("apply-wallpapers");
          },
     );

     ipcMain.handle("clear-all-wallpapers", async () => {
          logger.ipcReceived("clear-all-wallpapers");
          await updateConfig({ screens: [] });
          return await socketClient.send("apply-wallpapers");
     });

     ipcMain.handle("load-wallpapers", async () => {
          logger.ipcReceived("load-wallpapers");
          return await socketClient.send("load-wallpapers");
     });

     ipcMain.handle("get-wallpaper-preview", async (_, path: string) => {
          logger.ipcReceived("get-wallpaper-preview", path);
          return { success: true, data: path }; // In Go we already prefix with wallpaper://
     });

     ipcMain.handle("get-wallpaper-project-data", async (_, id: string) => {
          logger.ipcReceived("get-wallpaper-project-data", id);
          return await socketClient.send("get-wallpaper-project-data", { id });
     });

     ipcMain.handle("get-wallpaper-properties", async (_, id: string) => {
          logger.ipcReceived("get-wallpaper-properties", id);
          // For now returning empty as parsing properties output is complex
          return [];
     });

     ipcMain.handle(
          "save-wallpaper-property",
          async (_, id: string, key: string, value: string) => {
               logger.ipcReceived("save-wallpaper-property", id, key, value);
               await updateWallpaperProperties(id, key, value);
               return await socketClient.send("apply-wallpapers");
          },
     );
}
