import { ipcMain, dialog, BrowserWindow, app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { logger } from "../../backend/logger";

export function registerFileService() {
     ipcMain.handle("select-dir", async (event) => {
          logger.ipcReceived("select-dir");
          const win = BrowserWindow.fromWebContents(event.sender);
          const directory = await dialog.showOpenDialog(win!, {
               properties: ["openDirectory"],
          });

          return directory.filePaths[0];
     });

     ipcMain.handle("select-file", async (event) => {
          logger.ipcReceived("select-file");
          const win = BrowserWindow.fromWebContents(event.sender);
          const file = await dialog.showOpenDialog(win!, {
               properties: ["openFile"],
          });

          return file.filePaths[0];
     });

     ipcMain.handle("fs-read-dir", async (_, dirPath: string) => {
          logger.ipcReceived("fs-read-dir", dirPath);
          if (dirPath.startsWith("~")) {
               dirPath = path.join(app.getPath("home"), dirPath.slice(1));
          }
          try {
               const entries = await fs.readdir(dirPath, { withFileTypes: true });
               return entries.map((e) => ({
                    entry: e.name,
                    type: e.isDirectory() ? "DIRECTORY" : "FILE",
               }));
          } catch (e: any) {
               logger.error("Error reading dir:", dirPath, e);
               throw e;
          }
     });

     ipcMain.handle("fs-read-file", async (_, filePath: string) => {
          logger.ipcReceived("fs-read-file", filePath);
          if (filePath.startsWith("~")) {
               filePath = path.join(app.getPath("home"), filePath.slice(1));
          }
          return await fs.readFile(filePath, "utf-8");
     });

     ipcMain.handle(
          "fs-write-file",
          async (_, filePath: string, content: string) => {
               logger.ipcReceived("fs-write-file", filePath);
               if (filePath.startsWith("~")) {
                    filePath = path.join(app.getPath("home"), filePath.slice(1));
               }
               await fs.writeFile(filePath, content, "utf-8");
          }
     );

     ipcMain.handle("fs-read-binary", async (_, filePath: string) => {
          logger.ipcReceived("fs-read-binary", filePath);
          if (filePath.startsWith("~")) {
               filePath = path.join(app.getPath("home"), filePath.slice(1));
          }
          const buffer = await fs.readFile(filePath);
          return buffer.buffer;
     });

     ipcMain.handle("fs-exists", async (_, filePath: string) => {
          logger.ipcReceived("fs-exists", filePath);
          if (filePath.startsWith("~")) {
               filePath = path.join(app.getPath("home"), filePath.slice(1));
          }
          try {
               await fs.access(filePath);
               return true;
          } catch {
               return false;
          }
     });
}
