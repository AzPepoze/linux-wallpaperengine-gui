import { socketClient } from "../socket-client";
import type { AppConfig } from "../../shared/types";

export async function getConfig(): Promise<AppConfig> {
     return await socketClient.send("get-config");
}

export async function writeConfig(config: AppConfig): Promise<any> {
     return await socketClient.send("write-config", config);
}

export async function updateConfig(
     updates: Partial<AppConfig>,
): Promise<AppConfig> {
     const current = await getConfig();
     const merged = { ...current, ...updates };
     await writeConfig(merged);
     return merged;
}

export async function updateScreenConfig(
     screenName: string,
     wallpaperName: string | null,
): Promise<void> {
     const config = await getConfig();
     const screens = config.screens || [];
     const screenIndex = screens.findIndex((s: any) => s.name === screenName);

     if (screenIndex > -1) {
          screens[screenIndex].wallpaper = wallpaperName;
     } else {
          screens.push({ name: screenName, wallpaper: wallpaperName });
     }

     await writeConfig({ ...config, screens });
}

export async function updateWallpaperProperties(
     id: string,
     key: string,
     value: string,
): Promise<void> {
     const config = await getConfig();
     if (!config.wallpaperProperties) {
          config.wallpaperProperties = {};
     }
     if (!config.wallpaperProperties[id]) {
          config.wallpaperProperties[id] = {};
     }
     config.wallpaperProperties[id][key] = value;
     await writeConfig(config);
}
