import { ipcMain, BrowserWindow, app } from "electron";
import { logger } from "../logger";
import { socketClient } from "../socket-client";

export async function quit() {
     try {
          await socketClient.send("kill-all-wallpapers");
          await socketClient.send("quit");
     } catch (err) {
          logger.backend("Error sending quit to backend:", err);
          app.quit();
     }
}

export function registerWindowService() {
     ipcMain.handle("app-exit", async () => {
          logger.ipcReceived("app-exit");
          quit();
     });

     ipcMain.handle("window-minimize", (event) => {
          logger.ipcReceived("window-minimize");
          const win = BrowserWindow.fromWebContents(event.sender);
          win?.minimize();
     });

     ipcMain.handle("window-maximize", (event) => {
          logger.ipcReceived("window-maximize");
          const win = BrowserWindow.fromWebContents(event.sender);
          if (win?.isMaximized()) {
               win.unmaximize();
          } else {
               win?.maximize();
          }
     });

     ipcMain.handle("window-hide", (event) => {
          logger.ipcReceived("window-hide");
          logger.backend("Window destroyed (via ipc)");
          const win = BrowserWindow.fromWebContents(event.sender);
          win?.close();
     });
}
