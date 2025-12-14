//-------------------------------------------------------
// Type Definitions
//-------------------------------------------------------
let homePath: string;
let configPath: string;
let wallperBasePath: string;
const activeWallpapers = new Map<string, number>();

export async function main() {
     if (!window.electronAPI) {
          console.error("electronAPI is not available");
          return;
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
}

interface ScreenConfig {
     name: string;
     wallpaper: string | null;
}

interface AppConfig {
     screens?: ScreenConfig[];
     FPS?: number;
     SILENCE?: boolean;
}

//-------------------------------------------------------
// Helper Functions
//-------------------------------------------------------

const readConfig = async (): Promise<AppConfig> => {
     try {
          const configContent = await window.electronAPI.readFile(configPath);
          return JSON.parse(configContent);
     } catch (err: any) {
          // Check for ENOENT (File not found)
          if (
               err.code !== "ENOENT" &&
               !JSON.stringify(err).includes("ENOENT")
          ) {
               console.warn(
                    "Could not read config.json, returning default. Error:",
                    err
               );
          }
          return {};
     }
};

const writeConfig = async (newConfig: AppConfig): Promise<void> => {
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

          // 1. Identify which screens are in the new config
          const configScreenNames = new Set(screens.map((s) => s.name));

          // 2. Stop processes for screens that are NO LONGER in the config
          for (const [screenName, pid] of activeWallpapers.entries()) {
               if (!configScreenNames.has(screenName)) {
                    await window.electronAPI.execCommand(`kill -- -${pid}`);
                    activeWallpapers.delete(screenName);
               }
          }

          // 3. Start/Update processes for screens in the config
          for (const screen of screens) {
               if (!screen.wallpaper) continue;

               // If we already have a running process for this screen, kill it first
               // This ensures we apply any new settings or wallpaper selection
               if (activeWallpapers.has(screen.name)) {
                    const oldPid = activeWallpapers.get(screen.name);
                    console.log(oldPid);
                    await window.electronAPI.execCommand(`kill -- -${oldPid}`);
                    activeWallpapers.delete(screen.name);
               }

               let args = `-r ${screen.name} -f ${fps}`;
               if (isSilenced) {
                    args += " -s";
               }
               args += ` ${screen.wallpaper}`;

               // Spawn new process
               const result = await window.electronAPI.execCommand(
                    `linux-wallpaperengine ${args}`
               );

               if (result && result.pid) {
                    activeWallpapers.set(screen.name, result.pid);
               }
          }

          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          console.error(`Error in manageWallpaper: ${error}`);
          return { success: false, error };
     }
};

//-------------------------------------------------------
// Exported API Functions
//-------------------------------------------------------

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
          console.log(`Found ${entries.length} total entries.`);

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
                              console.warn(
                                   `Could not process project.json for ${folder.entry}:`,
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
          console.error("Failed to get wallpapers:", error);
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
          // Use xdg-open for Linux
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
          console.error(
               `Error in getWallpaperPreview for path "${path}": ${error}`
          );
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
               console.error("electronAPI is not available");
               return { success: false, error: "electronAPI is not available" };
          }
          const commandResult = await window.electronAPI.execCommand(
               "xrandr --query"
          );
          console.log("xrandr --query commandResult:", commandResult);

          let stdout = "";

          if (typeof commandResult === "string") {
               stdout = commandResult; // Just in case
          } else if (commandResult.stdout) {
               stdout = commandResult.stdout;
          }

          if (!stdout && commandResult.error) {
               console.error(`Error executing xrandr: ${commandResult.error}`);
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
          console.error(`Error in getScreens: ${error}`);
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
          await manageWallpaper(); // Stop all running wallpapers
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          console.error(`Error in clearAllWallpapers: ${error}`);
          return { success: false, error };
     }
};
