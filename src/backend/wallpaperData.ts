import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger";
import { getWallpaperBasePath } from "./config";

export const getWallpapers = async () => {
     try {
          const basePath = await getWallpaperBasePath();
          const entries = await fs.readdir(basePath, { withFileTypes: true });
          logger.backend(`Found ${entries.length} total entries.`);

          const directoryEntries = entries.filter((e) => e.isDirectory());
          const wallpapers: Record<
               string,
               {
                    projectData: any;
                    previewPath: string | null;
               }
          > = {};

          const batchSize = 10;
          for (let i = 0; i < directoryEntries.length; i += batchSize) {
               const batch = directoryEntries.slice(i, i + batchSize);

               const batchPromises = batch.map(
                    async (
                         folder
                    ): Promise<
                         [
                              string,
                              {
                                   projectData: any;
                                   previewPath: string | null;
                              }
                         ]
                    > => {
                         const folderName = folder.name;
                         const wallpaperPath = path.join(basePath, folderName);
                         const projectJsonPath = path.join(
                              wallpaperPath,
                              "project.json"
                         );
                         let previewPath = null;
                         let projectData: any = {};

                         try {
                              const projectJsonContent = await fs.readFile(
                                   projectJsonPath,
                                   "utf-8"
                              );
                              projectData = JSON.parse(projectJsonContent);

                              if (projectData.preview) {
                                   previewPath = `wallpaper://${path.join(
                                        basePath,
                                        folderName,
                                        projectData.preview
                                   )}`;
                              }

                              projectData = {
                                   title: projectData.title,
                                   type: projectData.type,
                                   description: projectData.description,
                                   tags: projectData.tags,
                                   contentrating: projectData.contentrating,
                                   version: projectData.version,
                              };
                         } catch (readError) {
                              logger.backend(
                                   `Could not process project.json for ${folderName}: ` +
                                        readError
                              );
                         }
                         return [folderName, { projectData, previewPath }];
                    }
               );

               const processedBatch = await Promise.all(batchPromises);
               Object.assign(wallpapers, Object.fromEntries(processedBatch));

               if (i % 50 === 0 && i > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 20));
               }
          }

          return { success: true, wallpapers };
     } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          logger.backend("Failed to get wallpapers: " + error);
          return { success: false, error };
     }
};

export const getWallpaperPreview = async (wallpaperPath: string) => {
     try {
          const basePath = await getWallpaperBasePath();
          const relativePath = wallpaperPath.replace("wallpapers/", "");
          const filePath = path.join(basePath, relativePath);

          return {
               success: true,
               data: `wallpaper://${filePath}`,
          };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logger.backend(
               `Error in getWallpaperPreview for path "${wallpaperPath}": ${error}`
          );
          return { success: false, error };
     }
};

export const getWallpaperProjectData = async (folderName: string) => {
     try {
          const basePath = await getWallpaperBasePath();
          const projectJsonPath = path.join(
               basePath,
               folderName,
               "project.json"
          );
          const content = await fs.readFile(projectJsonPath, "utf-8");
          const data = JSON.parse(content);

          const properties = data.general?.properties || data.properties || {};

          if (data.schemecolor && !properties.schemecolor) {
               properties.schemecolor = {
                    type: "color",
                    text: "Theme Color",
                    value: data.schemecolor,
                    order: -1,
               };
          }

          return { success: true, properties };
     } catch (err) {
          return { success: false, error: String(err) };
     }
};
