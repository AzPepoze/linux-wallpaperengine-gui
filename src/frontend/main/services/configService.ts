import { ipcMain } from "electron";
import { socketClient } from "../socket-client";
import { logger } from "../logger";
import type { AppConfig } from "../../shared/types";

export function registerConfigService() {
     ipcMain.handle("get-config", async () => {
          logger.ipcReceived("get-config");
          try {
               const config = await socketClient.send("get-config");
               return { success: true, ...config };
          } catch (err: any) {
               return { success: false, error: err.message };
          }
     });

     ipcMain.handle("read-config", async () => {
          logger.ipcReceived("read-config");
          return await socketClient.send("get-config");
     });

     ipcMain.handle(
          "save-config",
          async (_, newConfig: Omit<AppConfig, "screens">) => {
               logger.ipcReceived("save-config");
               const currentConfig = await socketClient.send("get-config");
               const updatedConfig = { ...currentConfig, ...newConfig };
               return await socketClient.send("write-config", updatedConfig);
          },
     );

     ipcMain.handle("write-config", async (_, newConfig: AppConfig) => {
          logger.ipcReceived("write-config");
          return await socketClient.send("write-config", newConfig);
     });

     ipcMain.handle("open-config-editor", async () => {
          logger.ipcReceived("open-config-editor");
          return await socketClient.send("open-config-editor");
     });

     ipcMain.handle("get-wallpaper-executable", async () => {
          logger.ipcReceived("get-wallpaper-executable");
          const config = await socketClient.send("get-config");
          return config.customExecutableLocation || "linux-wallpaperengine";
     });

     ipcMain.handle("validate-executable", async () => {
          logger.ipcReceived("validate-executable");
          return true; // Simplified
     });
}
