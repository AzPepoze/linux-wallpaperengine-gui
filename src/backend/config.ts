import { app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { logger } from "./logger";
import { EXECUTABLE_NAME } from "../shared/constants";
import { spawn } from "node:child_process";
import { AppConfig } from "../shared/types";

let homePath: string;
let configPath: string;
let wallperBasePath: string;

export const DEFAULT_CONFIG: AppConfig = {
     FPS: 60,
     SILENCE: false,
     customArgs: "",
     customArgsEnabled: false,
     volume: 100,
     noAutomute: false,
     noAudioProcessing: false,
     scaling: "default",
     clamping: "clamp",
     disableMouse: false,
     disableParallax: false,
     disableParticles: false,
     noFullscreenPause: false,
     customExecutableLocation: "",
     cloneMode: false,
     globalWallpaper: null,
     screens: [],
     fullscreenPauseOnlyActive: false,
     fullscreenPauseIgnoreAppIds: [],
     screenshot: "",
     screenshotDelay: 5,
     assetsDir: "",
     properties: {},
     dumpStructure: false,
     playlist: [],
};

export const ensureInitialized = async () => {
     if (configPath && homePath && wallperBasePath) return;

     homePath = app.getPath("home");
     configPath = path.join(
          homePath,
          ".config/linux-wallpaperengine-gui/config.json"
     );

     const workshopSuffix = "steamapps/workshop/content/431960";
     const steamPaths = [
          ".local/share/Steam",
          ".var/app/com.valvesoftware.Steam/.local/share/Steam",
          ".steam/steam",
          ".steam/root",
     ];

     for (const steamPath of steamPaths) {
          const fullPath = path.join(homePath, steamPath, workshopSuffix);
          try {
               await fs.access(fullPath);
               wallperBasePath = fullPath;
               logger.backend(`Found Steam Workshop path: ${wallperBasePath}`);
               break;
          } catch {
               continue;
          }
     }

     if (!wallperBasePath) {
          wallperBasePath = path.join(
               homePath,
               ".local/share/Steam",
               workshopSuffix
          );
          logger.backend(
               `Could not find any existing Steam Workshop path, defaulting to: ${wallperBasePath}`
          );
     }
};

export const getWallpaperBasePath = async () => {
     await ensureInitialized();
     return wallperBasePath;
};

export const readConfig = async (): Promise<AppConfig> => {
     try {
          await ensureInitialized();
          const configContent = await fs.readFile(configPath, "utf-8");
          const userConfig = JSON.parse(configContent);
          return { ...DEFAULT_CONFIG, ...userConfig };
     } catch (err: any) {
          if (err.code !== "ENOENT") {
               logger.error(
                    "Could not read config.json, returning default. Error: " +
                         err
               );
          }
          return DEFAULT_CONFIG;
     }
};

export const writeConfig = async (newConfig: AppConfig): Promise<void> => {
     await ensureInitialized();

     const configDir = path.dirname(configPath);
     try {
          await fs.access(configDir);
     } catch {
          await fs.mkdir(configDir, { recursive: true });
     }

     await fs.writeFile(
          configPath,
          JSON.stringify(newConfig, null, 2),
          "utf-8"
     );
};

export type GetConfigResult =
     | ({ success: true } & AppConfig)
     | { success: false; error: string };

export const getConfig = async (): Promise<GetConfigResult> => {
     try {
          const config = await readConfig();
          return { success: true, ...config };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
};

export const saveConfig = async (newConfig: Omit<AppConfig, "screens">) => {
     try {
          const currentConfig = await readConfig();
          const updatedConfig: AppConfig = {
               ...currentConfig,
               ...newConfig,
          };
          await writeConfig(updatedConfig);
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
};

export const openConfigInEditor = async () => {
     try {
          await ensureInitialized();
          const proc = spawn(`xdg-open "${configPath}"`, { shell: true });
          return new Promise<{ success: boolean; error?: string }>(
               (resolve) => {
                    proc.on("close", (code) => {
                         if (code === 0) resolve({ success: true });
                         else
                              resolve({
                                   success: false,
                                   error: `Exited with ${code}`,
                              });
                    });
                    proc.on("error", (err) =>
                         resolve({ success: false, error: err.message })
                    );
               }
          );
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
};

export const getWallpaperExecutableLocation = async (): Promise<string> => {
     const config = await readConfig();
     return config.customExecutableLocation &&
          config.customExecutableLocation !== ""
          ? config.customExecutableLocation
          : EXECUTABLE_NAME;
};

export const validateExecutable = async (): Promise<boolean> => {
     try {
          await getWallpaperExecutableLocation();
          return true;
     } catch {
          return false;
     }
};
