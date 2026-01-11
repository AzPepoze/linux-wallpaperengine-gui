import { logGui } from "./logger";
import { EXECUTABLE_NAME } from "../shared/constants";

let homePath: string;
let configPath: string;
let wallperBasePath: string;
const activeWallpapers = new Map<string, number>();

export async function main() {
     await ensureInitialized();
}

interface ScreenConfig {
     name: string;
     wallpaper: string | null;
}

interface AppConfig {
     screens?: ScreenConfig[];
     FPS?: number;
     SILENCE?: boolean;
     customArgs?: string;
     customArgsEnabled?: boolean;
     volume?: number;
     noAutomute?: boolean;
     noAudioProcessing?: boolean;
     scaling?: string;
     clamping?: string;
     disableMouse?: boolean;
     disableParallax?: boolean;
     disableParticles?: boolean;
     noFullscreenPause?: boolean;
     customExecutableLocation?: string;
}

const ensureInitialized = async () => {
     if (configPath && homePath && wallperBasePath) return;

     if (!window.electronAPI) {
          throw new Error("electronAPI is not available");
     }

     homePath = (await window.electronAPI.getEnv("HOME")) || "";
     configPath = `${homePath}/.config/linux-wallpaperengine-gui/config.json`;
     wallperBasePath = [
          homePath,
          ".local",
          "share",
          "Steam",
          "steamapps",
          "workshop",
          "content",
          "431960",
     ].join("/");
};

const readConfig = async (): Promise<AppConfig> => {
     try {
          await ensureInitialized();
          const configContent = await window.electronAPI.readFile(configPath);
          return JSON.parse(configContent);
     } catch (err: any) {
          if (
               err.code !== "ENOENT" &&
               !JSON.stringify(err).includes("ENOENT")
          ) {
               logGui(
                    "Could not read config.json, returning default. Error: " +
                         err
               );
          }
          return {};
     }
};

const writeConfig = async (newConfig: AppConfig): Promise<void> => {
     await ensureInitialized();
     await window.electronAPI.writeFile(
          configPath,
          JSON.stringify(newConfig, null, 2)
     );
};

export const manageWallpaper = async (): Promise<{
     success: boolean;
     error?: string;
}> => {
     try {
          const config = await readConfig();
          const screens = config.screens || [];
          const fps = config.FPS || 60;
          const isSilenced = config.SILENCE || false;
          const customArgs = config.customArgs || "";
          const customArgsEnabled = config.customArgsEnabled || false;

          const configScreenNames = new Set(screens.map((s) => s.name));

          for (const [screenName, pid] of activeWallpapers.entries()) {
               if (!configScreenNames.has(screenName)) {
                    await window.electronAPI.execCommand(`kill -- -${pid}`);
                    activeWallpapers.delete(screenName);
               }
          }

          for (const screen of screens) {
               if (!screen.wallpaper) continue;

               if (activeWallpapers.has(screen.name)) {
                    const oldPid = activeWallpapers.get(screen.name);
                    logGui(String(oldPid));
                    await window.electronAPI.execCommand(`kill -- -${oldPid}`);
                    activeWallpapers.delete(screen.name);
               }

               let args = `${screen.wallpaper} -r ${screen.name} -f ${fps}`;

               if (isSilenced) {
                    args += " -s";
               } else if (config.volume !== undefined) {
                    args += ` --volume ${config.volume}`;
               }

               if (config.noAutomute) args += " --noautomute";
               if (config.noAudioProcessing) args += " --no-audio-processing";
               if (config.scaling) args += ` --scaling ${config.scaling}`;
               if (config.clamping) args += ` --clamping ${config.clamping}`;
               if (config.disableMouse) args += " --disable-mouse";
               if (config.disableParallax) args += " --disable-parallax";
               if (config.noFullscreenPause) args += " --no-fullscreen-pause";
               if (config.disableParticles) args += " --disable-particles";

               if (customArgsEnabled && customArgs) {
                    args += ` ${customArgs}`;
               }

               const executable = await getWallpaperExecutableLocation();
               const result = await window.electronAPI.execCommand(
                    `${executable} ${args}`,
                    [],
                    false
               );

               if (result && result.pid) {
                    activeWallpapers.set(screen.name, result.pid);
               }
          }

          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logGui(`Error in manageWallpaper: ${error}`);
          return { success: false, error };
     }
};

export const getWallpapers = async () => {
     try {
          const home = (await window.electronAPI.getEnv("HOME")) || "";
          const basePath = [
               home,
               ".local",
               "share",
               "Steam",
               "steamapps",
               "workshop",
               "content",
               "431960",
          ].join("/");

          const entries = await window.electronAPI.readDirectory(basePath);
          logGui(`Found ${entries.length} total entries.`);

          const directoryEntries = entries.filter(
               (e) => e.type === "DIRECTORY"
          );
          const wallpapers: Record<
               string,
               { previewPath: string | null; projectData: any }
          > = {};

          const batchSize = 50;
          for (let i = 0; i < directoryEntries.length; i += batchSize) {
               const batch = directoryEntries.slice(i, i + batchSize);

               const batchPromises = batch.map(
                    async (
                         folder
                    ): Promise<
                         [
                              string,
                              { previewPath: string | null; projectData: any }
                         ]
                    > => {
                         const wallpaperPath = `${basePath}/${folder.entry}`;
                         const projectJsonPath = `${wallpaperPath}/project.json`;
                         let previewPath = null;
                         let projectData: any = {};

                         try {
                              const projectJsonContent =
                                   await window.electronAPI.readFile(
                                        projectJsonPath
                                   );
                              projectData = JSON.parse(projectJsonContent);

                              if (projectData.preview) {
                                   previewPath = `wallpapers/${folder.entry}/${projectData.preview}`;
                              }
                         } catch (readError) {
                              logGui(
                                   `Could not process project.json for ${folder.entry}: ` +
                                        readError
                              );
                         }
                         return [folder.entry, { previewPath, projectData }];
                    }
               );

               const processedBatch = await Promise.all(batchPromises);
               Object.assign(wallpapers, Object.fromEntries(processedBatch));
          }

          return { success: true, wallpapers };
     } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          logGui("Failed to get wallpapers: " + error);
          return { success: false, error };
     }
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
          await manageWallpaper();
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
};

export const setWallpaper = async (
     screenName: string,
     wallpaperFolderName: string | null
) => {
     const config = await readConfig();
     const screens = config.screens || [];
     const screenIndex = screens.findIndex((s) => s.name === screenName);

     if (screenIndex > -1) {
          screens[screenIndex].wallpaper = wallpaperFolderName;
     } else {
          screens.push({ name: screenName, wallpaper: wallpaperFolderName });
     }

     await writeConfig({ ...config, screens });
     return await manageWallpaper();
};

export const openConfigInEditor = async () => {
     try {
          await window.electronAPI.execCommand(`xdg-open "${configPath}"`);
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          return { success: false, error };
     }
};

export const getWallpaperPreview = async (path: string) => {
     try {
          const relativePath = path.replace("wallpapers/", "");
          const filePath = `${wallperBasePath}/${relativePath}`;

          return {
               success: true,
               data: `wallpaper://${filePath}`,
          };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logGui(`Error in getWallpaperPreview for path "${path}": ${error}`);
          return { success: false, error };
     }
};

export const getScreens = async (): Promise<{
     success: boolean;
     screens?: string[];
     error?: string;
}> => {
     try {
          if (!window.electronAPI) {
               logGui("electronAPI is not available");
               return { success: false, error: "electronAPI is not available" };
          }
          const commandResult = await window.electronAPI.execCommand(
               "xrandr --query",
               [],
               false
          );
          logGui(
               "xrandr --query commandResult: " + JSON.stringify(commandResult)
          );

          let stdout = "";

          if (typeof commandResult === "string") {
               stdout = commandResult;
          } else if (commandResult.stdout) {
               stdout = commandResult.stdout;
          }

          if (!stdout && commandResult.error) {
               logGui(`Error executing xrandr: ${commandResult.error}`);
               return { success: false, error: commandResult.error };
          }

          if (!stdout) {
               return {
                    success: false,
                    error: "xrandr --query returned no output.",
               };
          }

          const lines = stdout.split("\n");
          const screenNames: string[] = [];

          for (const line of lines) {
               if (line.includes(" connected")) {
                    const screenName = line.split(" ")[0];
                    screenNames.push(screenName);
               }
          }

          if (screenNames.length === 0) {
               return {
                    success: false,
                    error: "No connected screens found by xrandr.",
               };
          }

          return { success: true, screens: screenNames };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logGui(`Error in getScreens: ${error}`);
          return { success: false, error };
     }
};

export const clearAllWallpapers = async (): Promise<{
     success: boolean;
     error?: string;
}> => {
     try {
          const currentConfig = await readConfig();
          const updatedConfig: AppConfig = { ...currentConfig, screens: [] };
          await writeConfig(updatedConfig);
          await manageWallpaper();
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logGui(`Error in clearAllWallpapers: ${error}`);
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
          const config = await readConfig();
          const isCustom =
               config.customExecutableLocation &&
               config.customExecutableLocation !== "";
          const executable = isCustom
               ? config.customExecutableLocation!
               : EXECUTABLE_NAME;

          if (isCustom) {
               return await window.electronAPI.fsExists(executable);
          }

          // For default EXECUTABLE_NAME, try running with --help to check if it's in PATH
          try {
               const result = await window.electronAPI.execCommand(
                    `${executable} --help`,
                    [],
                    false
               );

               if (
                    typeof result === "object" &&
                    (result.pid ||
                         result.stdout !== undefined ||
                         result.stderr !== undefined)
               ) {
                    return true;
               }

               return false;
          } catch (err) {
               return false;
          }
     } catch {
          return false;
     }
};
