import { writable, get } from "svelte/store";
import { logger } from "./logger";

export const screens = writable<Record<string, string | null>>({});
export const selectedScreen = writable<string | null>(null);
export const cloneMode = writable<boolean>(false);

export async function refreshScreens() {
     logger.log("Refreshing screens...");
     const screensResult = await window.electronAPI.getScreens();
     if ("error" in screensResult) {
          logger.error(`Failed to get screens: ${screensResult.error}`);
          return;
     }

     const connectedScreens = screensResult.screens || [];
     let nextScreens: Record<string, string | null> = {};

     connectedScreens.forEach((s: string) => {
          nextScreens[s] = null;
     });

     const configResult = await window.electronAPI.getConfig();
     if (configResult.success) {
          cloneMode.set(configResult.cloneMode || false);

          if (configResult.screens) {
               configResult.screens.forEach((s: any) => {
                    if (nextScreens.hasOwnProperty(s.name)) {
                         nextScreens[s.name] = s.wallpaper;
                    }
               });
          }
     }

     screens.set(nextScreens);

     let currentSelected = get(selectedScreen);
     if (connectedScreens.length > 0) {
          if (!currentSelected || !connectedScreens.includes(currentSelected)) {
               selectedScreen.set(connectedScreens[0]);
          }
     } else {
          selectedScreen.set(null);
     }
}

export async function toggleCloneMode(
     enabled: boolean,
     currentWallpaper?: string | null
) {
     await window.electronAPI.toggleCloneMode(enabled, currentWallpaper);
     await refreshScreens();
}

export function initDisplay() {
     if (window.electronAPI) {
          window.electronAPI.on("screens-changed", () => {
               logger.log("Screens changed detected, refreshing...");
               refreshScreens();
          });
     }
}
