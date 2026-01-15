import { ipcMain } from "electron";
import { socketClient } from "../socket-client";
import { logger } from "../logger";

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
                    wallpaperFolderName
               );
               const config = await socketClient.send("get-config");
               const screens = config.screens || [];
               const screenIndex = screens.findIndex((s: any) => s.name === screenName);

               if (screenIndex > -1) {
                    screens[screenIndex].wallpaper = wallpaperFolderName;
               } else {
                    screens.push({ name: screenName, wallpaper: wallpaperFolderName });
               }

               const updateData: any = { screens };
               if (config.cloneMode) {
                    updateData.globalWallpaper = wallpaperFolderName;
               }

               await socketClient.send("write-config", { ...config, ...updateData });
               return await socketClient.send("apply-wallpapers");
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
               const config = await socketClient.send("get-config");
               const updateData: any = {
                    cloneMode: enabled,
               };

               if (globalWallpaper !== undefined) {
                    updateData.globalWallpaper = globalWallpaper;
               }

               await socketClient.send("write-config", { ...config, ...updateData });
               return await socketClient.send("apply-wallpapers");
          }
     );

     ipcMain.handle("clear-all-wallpapers", async () => {
          logger.ipcReceived("clear-all-wallpapers");
          const currentConfig = await socketClient.send("get-config");
          const updatedConfig = { ...currentConfig, screens: [] };
          await socketClient.send("write-config", updatedConfig);
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
               const config = await socketClient.send("get-config");
               if (!config.wallpaperProperties) {
                    config.wallpaperProperties = {};
               }
               if (!config.wallpaperProperties[id]) {
                    config.wallpaperProperties[id] = {};
               }
               config.wallpaperProperties[id][key] = value;
               await socketClient.send("write-config", config);
               return await socketClient.send("apply-wallpapers");
          }
     );
}