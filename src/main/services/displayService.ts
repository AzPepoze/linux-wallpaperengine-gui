import { ipcMain } from "electron";
import { getScreens } from "../../backend/wallpaperDisplay";
import { logger } from "../../backend/logger";

export function registerDisplayService() {
     ipcMain.handle("get-screens", async () => {
          logger.ipcReceived("get-screens");
          return await getScreens();
     });
}
