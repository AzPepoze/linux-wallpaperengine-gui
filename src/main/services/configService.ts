import { ipcMain } from "electron";
import {
     getConfig,
     readConfig,
     saveConfig,
     writeConfig,
     openConfigInEditor,
     getWallpaperExecutableLocation,
     validateExecutable,
} from "../../backend/config";
import { AppConfig } from "../../shared/types";
import { logger } from "../../backend/logger";

export function registerConfigService() {
     ipcMain.handle("get-config", async () => {
          logger.ipcReceived("get-config");
          return await getConfig();
     });

     ipcMain.handle("read-config", async () => {
          logger.ipcReceived("read-config");
          return await readConfig();
     });

     ipcMain.handle(
          "save-config",
          async (_, newConfig: Omit<AppConfig, "screens">) => {
               logger.ipcReceived("save-config");
               return await saveConfig(newConfig);
          }
     );

     ipcMain.handle("write-config", async (_, newConfig: AppConfig) => {
          logger.ipcReceived("write-config");
          return await writeConfig(newConfig);
     });

     ipcMain.handle("open-config-editor", async () => {
          logger.ipcReceived("open-config-editor");
          return await openConfigInEditor();
     });

     ipcMain.handle("get-wallpaper-executable", async () => {
          logger.ipcReceived("get-wallpaper-executable");
          return await getWallpaperExecutableLocation();
     });

     ipcMain.handle("validate-executable", async () => {
          logger.ipcReceived("validate-executable");
          return await validateExecutable();
     });
}
