import { writable, get } from "svelte/store";
import * as wallpaperManager from "../../backend/wallpaperManager";
import { logGui } from "../../backend/logger";

export const screens = writable<Record<string, string | null>>({});
export const selectedScreen = writable<string | null>(null);
export const singleWallpaperMode = writable<boolean>(false);

export async function refreshScreens() {
     logGui("Refreshing screens...");
     const screensResult = await wallpaperManager.getScreens();
     let connectedScreens: string[] = [];

     if (screensResult.success && screensResult.screens) {
          connectedScreens = screensResult.screens;
     } else if (screensResult.error) {
          console.error(`Failed to get screens: ${screensResult.error}`);
     }

     let currentScreens = get(screens);
     let nextScreens: Record<string, string | null> = {};

     connectedScreens.forEach((s: string) => {
          nextScreens[s] = null;
     });

     for (const s of connectedScreens) {
          if (currentScreens[s]) {
               nextScreens[s] = currentScreens[s];
          }
     }

     const configResult = await wallpaperManager.getConfig();
     if (configResult.success) {
          singleWallpaperMode.set(configResult.singleWallpaperMode || false);

          if (configResult.screens) {
               configResult.screens.forEach((s: any) => {
                    if (nextScreens.hasOwnProperty(s.name)) {
                         nextScreens[s.name] = s.wallpaper;
                    }
               });
          }
     }

     let currentSelected = get(selectedScreen);
     let fallbackWallpaper: string | null = null;
     if (currentSelected && currentScreens[currentSelected]) {
          fallbackWallpaper = currentScreens[currentSelected];
     } else {
          const found = Object.values(currentScreens).find((id) => id !== null);
          if (found) fallbackWallpaper = found;
     }

     for (const s of connectedScreens) {
          if (!nextScreens[s] && fallbackWallpaper) {
               console.log(
                    `Auto-assigning wallpaper to ${s}: ${fallbackWallpaper}`,
               );
               nextScreens[s] = fallbackWallpaper;
               await wallpaperManager.setWallpaper(s, fallbackWallpaper);
          }
     }

     screens.set(nextScreens);

     if (connectedScreens.length > 0) {
          if (!currentSelected || !connectedScreens.includes(currentSelected)) {
               selectedScreen.set(connectedScreens[0]);
          }
     } else {
          selectedScreen.set(null);
     }
}

export async function applyWallpaperToAllDisplays(wallpaperFolderName: string) {
     const screensResult = await wallpaperManager.getScreens();
     if (screensResult.success && screensResult.screens) {
          for (const screenName of screensResult.screens) {
               await wallpaperManager.setWallpaper(
                    screenName,
                    wallpaperFolderName,
               );
          }
          await refreshScreens();
     }
}

export async function toggleSingleMode(
     enabled: boolean,
     currentWallpaper?: string | null,
) {
     await wallpaperManager.toggleSingleWallpaperMode(
          enabled,
          currentWallpaper,
     );
     await refreshScreens();
}

export function initDisplay() {
     if (window.electronAPI) {
          window.electronAPI.on("screens-changed", () => {
               logGui("Screens changed detected, refreshing...");
               refreshScreens();
          });
     }
}