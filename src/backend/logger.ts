import { BrowserWindow } from "electron";
import { IPC_LOG_CHANNEL } from "../shared/constants";
import { cleanLog, addTimestamp } from "../shared/logger";

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow | null) {
     mainWindow = win;
}

function log(...args: any[]) {
     const message = cleanLog(...args);
     console.log(addTimestamp(message));
}

function logToFrontend(
     {
          type,
          showLog,
          data,
     }: {
          type: string;
          showLog: boolean;
          [key: string]: any;
     } = {
          type: "backend",
          showLog: true,
          data: [],
     }
) {
     const message = cleanLog(...data);
     if (showLog) log(`[${type.toUpperCase()}] ${message}`);

     if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_LOG_CHANNEL, {
               type,
               message,
          });
     }
}

export const logger = {
     frontend: (...args: any[]) => {
          const message = cleanLog(...args);
          log("[Frontend]:", message);
     },

     backend: (...args: any[]) => {
          logToFrontend({ type: "backend", showLog: true, data: args });
     },

     wallpaper: (...args: any[]) => {
          logToFrontend({ type: "wallpaper", showLog: false, data: args });
     },

     error: (...args: any[]) => {
          logToFrontend({
               type: "backend",
               showLog: true,
               data: ["[Backend ERROR]:", ...args],
          });
     },

     toFrontend: (type: string, ...args: any[]) => {
          logToFrontend({ type, showLog: true, data: args });
     },

     ipcReceived: (channel: string, ...args: any[]) => {
          logToFrontend({
               type: "backend",
               showLog: true,
               data: [`[IPC_RECEIVED] ${channel}`, ...args],
          });
     },
};
