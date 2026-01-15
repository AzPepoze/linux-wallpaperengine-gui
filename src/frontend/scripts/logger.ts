import { writable } from "svelte/store";
import { addTimestamp } from "../../shared/logger";
import { IPC_LOG_CHANNEL } from "../../shared/constants";

export const frontendLogs = writable<string[]>([]);
export const backendLogs = writable<string[]>([]);
export const wallpaperLogs = writable<string[]>([]);

const MAX_LOGS = 200;

function updateStore(store: typeof frontendLogs, message: string) {
     const lines = message.split("\n").filter((line) => line.trim() !== "");
     const entries = lines.map((line) => addTimestamp(line));

     store.update((logs) => {
          const newLogs = [...logs, ...entries];
          if (newLogs.length > MAX_LOGS) {
               return newLogs.slice(newLogs.length - MAX_LOGS);
          }
          return newLogs;
     });
}

export const logger = {
     log: (...args: any[]) => {
          const message = args.join(" ");
          console.log(addTimestamp(message));
          updateStore(frontendLogs, message);

          if (window.electronAPI) {
               window.electronAPI.sendLog("frontend", ...args);
          }
     },

     backend: (message: string) => {
          updateStore(backendLogs, message);
     },

     wallpaper: (message: string) => {
          updateStore(wallpaperLogs, message);
     },

     error: (...args: any[]) => {
          logger.log(`ERROR: ${args.join(" ")}`);
     },

     warn: (...args: any[]) => {
          logger.log(`WARNING: ${args.join(" ")}`);
     },

     clearAll: () => {
          frontendLogs.set([]);
          backendLogs.set([]);
          wallpaperLogs.set([]);
     },
};

export function initLogger() {
     if (window.electronAPI) {
          window.electronAPI.on(
               IPC_LOG_CHANNEL,
               (data: { type: string; message: string }) => {
                    logger[data.type as keyof typeof logger](data.message);
               }
          );
     }
}
