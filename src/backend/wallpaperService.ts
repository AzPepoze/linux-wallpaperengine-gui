import { spawn } from "node:child_process";
import { logger } from "./logger";
import {
     getConfig,
     readConfig,
     writeConfig,
     getWallpaperExecutableLocation,
} from "./config";
import { updateWallpapers } from "./wallpaperController";
import { getWallpapers } from "./wallpaperData";
import { getScreens } from "./wallpaperDisplay";
import type { WallpaperData, AppConfig, WallpaperProperty, PropertyType } from "../shared/types";

export const applyWallpapers = async (): Promise<{
     success: boolean;
     error?: string;
}> => {
     try {
          const config = await readConfig();
          let screens = config.screens || [];

          const availableScreens = await getScreens();
          if (availableScreens.success && availableScreens.screens) {
               const connectedScreens = new Set(availableScreens.screens);
               screens = screens.filter((s) => connectedScreens.has(s.name));
          }

          const fps = config.FPS || 60;
          const isSilenced = config.SILENCE || false;
          const customArgs = config.customArgs || "";
          const customArgsEnabled = config.customArgsEnabled || false;

          const desiredWallpapers: { screen: string; command: string }[] = [];
          const executable = await getWallpaperExecutableLocation();

          for (const screen of screens) {
               let targetWallpaper = screen.wallpaper;
               if (config.cloneMode && config.globalWallpaper) {
                    targetWallpaper = config.globalWallpaper;
               }

               if (!targetWallpaper) continue;

               let args = `${targetWallpaper} -r ${screen.name} -f ${fps}`;

               if (isSilenced) {
                    args += " -s";
               } else if (config.volume !== undefined) {
                    args += ` --volume ${config.volume}`;
               }

               if (config.noAutomute) args += " --noautomute";
               if (config.noAudioProcessing) args += " --no-audio-processing";
               if (config.scaling) args += ` --scaling ${config.scaling}`;
               if (config.clamping) args += ` --clamp ${config.clamping}`;
               if (config.disableMouse) args += " --disable-mouse";
               if (config.disableParallax) args += " --disable-parallax";
               if (config.noFullscreenPause) args += " --no-fullscreen-pause";
               if (config.disableParticles) args += " --disable-particles";

               if (config.fullscreenPauseOnlyActive)
                    args += " --fullscreen-pause-only-active";

               if (config.fullscreenPauseIgnoreAppIds) {
                    config.fullscreenPauseIgnoreAppIds.forEach((id) => {
                         args += ` --fullscreen-pause-ignore-appid ${id}`;
                    });
               }

               if (config.screenshot)
                    args += ` --screenshot "${config.screenshot}"`;
               if (config.screenshotDelay !== undefined)
                    args += ` --screenshot-delay ${config.screenshotDelay}`;

               if (config.assetsDir)
                    args += ` --assets-dir "${config.assetsDir}"`;
               if (config.dumpStructure) args += " --dump-structure";

               if (config.playlist) {
                    config.playlist.forEach((p) => {
                         args += ` --playlist "${p}"`;
                    });
               }

               if (config.wallpaperProperties && config.wallpaperProperties[targetWallpaper]) {
                    for (const [key, value] of Object.entries(
                         config.wallpaperProperties[targetWallpaper]
                    )) {
                         args += ` --set-property ${key}="${value}"`;
                    }
               } else if (config.properties) {
                    for (const [key, value] of Object.entries(
                         config.properties
                    )) {
                         args += ` --set-property ${key}="${value}"`;
                    }
               }

               if (customArgsEnabled && customArgs) {
                    args += ` ${customArgs}`;
               }

               const fullCommand = `${executable} ${args}`;
               desiredWallpapers.push({
                    screen: screen.name,
                    command: fullCommand,
               });
          }

          updateWallpapers(desiredWallpapers);

          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logger.backend(`Error in applyWallpapers: ${error}`);
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

     const updateData: Partial<AppConfig> = { screens };
     if (config.cloneMode) {
          updateData.globalWallpaper = wallpaperFolderName;
     }

     await writeConfig({ ...config, ...updateData });
     return await applyWallpapers();
};

export const toggleCloneMode = async (
     enabled: boolean,
     globalWallpaper?: string | null
) => {
     const config = await readConfig();
     const updateData: Partial<AppConfig> = {
          cloneMode: enabled,
     };

     if (globalWallpaper !== undefined) {
          updateData.globalWallpaper = globalWallpaper;
     }

     await writeConfig({ ...config, ...updateData });
     return await applyWallpapers();
};

export const clearAllWallpapers = async (): Promise<{
     success: boolean;
     error?: string;
}> => {
     try {
          const currentConfig = await readConfig();
          const updatedConfig: AppConfig = { ...currentConfig, screens: [] };
          await writeConfig(updatedConfig);
          await applyWallpapers();
          return { success: true };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logger.backend(`Error in clearAllWallpapers: ${error}`);
          return { success: false, error };
     }
};

export async function loadWallpapers() {
     let wallpapers: Record<string, WallpaperData> = {};
     let error: string | null = null;
     let initialWallpaper: { folderName: string } | null = null;

     try {
          const result = await getWallpapers();

          if (result.success) {
               wallpapers =
                    (result.wallpapers as Record<string, WallpaperData>) || {};
               const config = await getConfig();

               if (
                    config.success &&
                    config.screens &&
                    config.screens.length > 0
               ) {
                    const availableScreens = await getScreens();

                    let filteredScreens = config.screens;

                    if (availableScreens.success) {
                         filteredScreens = filteredScreens.filter((screen) => {
                              return availableScreens.screens?.some(
                                   (s) => s === screen.name
                              );
                         });
                    }

                    logger.backend(JSON.stringify(filteredScreens));

                    const firstScreenConfig = filteredScreens[0];
                    if (firstScreenConfig.wallpaper) {
                         const wallpaperData =
                              wallpapers[firstScreenConfig.wallpaper];
                         if (wallpaperData) {
                              initialWallpaper = {
                                   ...wallpaperData,
                                   folderName: firstScreenConfig.wallpaper,
                              };
                         }
                    }
               }
               await applyWallpapers();
          } else {
               error = result.error || "Unknown error";
          }
     } catch (e: any) {
          error = e.message || String(e);
          if (error) logger.backend(error);
     }

     return { wallpapers, error, selectedWallpaper: initialWallpaper };
}

export function killAllWallpapers() {
     spawn("killall -e linux-wallpaperengine", { shell: true, detached: true });
}

export async function getWallpaperProperties(
     wallpaperId: string
): Promise<WallpaperProperty[]> {
     const executable = await getWallpaperExecutableLocation();
     const child = spawn(executable, ["--list-properties", wallpaperId]);

     return new Promise((resolve) => {
          let output = "";
          child.stdout.on("data", (data) => {
               output += data.toString();
          });

          child.on("close", () => {
               const properties: WallpaperProperty[] = [];
               const sections = output.split(/\n\n/);

               for (const section of sections) {
                    const lines = section.trim().split("\n");
                    if (lines.length < 2) continue;

                    const firstLine = lines[0].trim();
                    const lastDashIndex = firstLine.lastIndexOf(" - ");
                    if (lastDashIndex === -1) continue;

                    const name = firstLine.substring(0, lastDashIndex).trim();
                    const typeStr = firstLine.substring(lastDashIndex + 3).trim();

                    const property: WallpaperProperty = {
                         name,
                         type: typeStr.toLowerCase() as PropertyType,
                         description: "",
                         value: "",
                    };

                    for (let i = 1; i < lines.length; i++) {
                         const line = lines[i].trim();
                         if (line.startsWith("Description:")) {
                              property.description = line
                                   .replace("Description:", "")
                                   .trim();
                         } else if (line.startsWith("Value:")) {
                              property.value = line.replace("Value:", "").trim();
                         } else if (line.startsWith("Minimum value:")) {
                              property.min = parseFloat(
                                   line.replace("Minimum value:", "").trim()
                              );
                         } else if (line.startsWith("Maximum value:")) {
                              property.max = parseFloat(
                                   line.replace("Maximum value:", "").trim()
                              );
                         } else if (line.startsWith("Step:")) {
                              property.step = parseFloat(
                                   line.replace("Step:", "").trim()
                              );
                         } else if (line.startsWith("R:")) {
                              const rgbaMatch = line.match(
                                   /R:\s*(.+)\s*G:\s*(.+)\s*B:\s*(.+)\s*A:\s*(.+)/
                              );
                              if (rgbaMatch) {
                                   property.value = `${rgbaMatch[1]} ${rgbaMatch[2]} ${rgbaMatch[3]} ${rgbaMatch[4]}`;
                              }
                         } else if (line.includes("Posible values:")) {
                              property.options = {};
                              let j = i + 1;
                              while (j < lines.length) {
                                   const optLine = lines[j].trim();
                                   const optMatch = optLine.match(
                                        /^(.+?)\s*->\s*(.+)$/
                                   );
                                   if (optMatch) {
                                        property.options[optMatch[2].trim()] =
                                             optMatch[1].trim();
                                        j++;
                                   } else {
                                        break;
                                   }
                              }
                              i = j - 1;
                         }
                    }
                    properties.push(property);
               }
               resolve(properties);
          });

          child.on("error", () => {
               resolve([]);
          });
     });
}

export async function saveWallpaperProperty(
     wallpaperId: string,
     key: string,
     value: string
) {
     const config = await readConfig();
     if (!config.wallpaperProperties) {
          config.wallpaperProperties = {};
     }
     if (!config.wallpaperProperties[wallpaperId]) {
          config.wallpaperProperties[wallpaperId] = {};
     }
     config.wallpaperProperties[wallpaperId][key] = value;
     await writeConfig(config);
     return await applyWallpapers();
}
