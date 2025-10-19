export type WallpaperData = {
    previewPath: string | null;
    projectData: any;
    previewData: string | undefined;
};

export type Wallpaper = WallpaperData & { folderName: string };