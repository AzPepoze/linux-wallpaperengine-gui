import { ipcMain, app } from "electron";
import { logger } from "../../backend/logger";

export function registerSystemService() {
     ipcMain.handle("get-env", async (_, key: string) => {
          logger.ipcReceived("get-env", key);
          return process.env[key];
     });

     ipcMain.handle("get-home-dir", () => {
          logger.ipcReceived("get-home-dir");
          return app.getPath("home");
     });
}
