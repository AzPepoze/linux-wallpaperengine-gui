import { writable } from "svelte/store";

export const guiLogs = writable<string[]>([]);
export const wallpaperLogs = writable<string[]>([]);

export function logGui(message: string) {
     const timestamp = new Date().toLocaleTimeString();
     const logEntry = `[${timestamp}] ${message}`;
     console.log(logEntry); // Also log to console
     guiLogs.update((logs) => {
          const newLogs = [...logs, logEntry];
          if (newLogs.length > 500) {
               return newLogs.slice(newLogs.length - 500);
          }
          return newLogs;
     });
}

export function logWallpaper(message: string) {
     // message might contain newlines, split them
     const lines = message.split('\n').filter(line => line.trim() !== '');
     const timestamp = new Date().toLocaleTimeString();
     const entries = lines.map(line => `[${timestamp}] ${line}`);
     
     wallpaperLogs.update((logs) => {
          const newLogs = [...logs, ...entries];
          if (newLogs.length > 500) {
               return newLogs.slice(newLogs.length - 500);
          }
          return newLogs;
     });
}

export function clearLogs() {
     guiLogs.set([]);
     wallpaperLogs.set([]);
}
