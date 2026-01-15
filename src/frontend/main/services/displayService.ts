import { ipcMain } from "electron";
import { socketClient } from "../socket-client";
import { logger } from "../logger";

export function registerDisplayService() {
     ipcMain.handle("get-screens", async () => {
          logger.ipcReceived("get-screens");
          return await socketClient.send("get-screens");
     });
}