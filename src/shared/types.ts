export type WallpaperProjectData = {
     title: string;
     description?: string;
     file: string;
     preview: string;
     type: string;
     tags?: string[];
     workshopid?: string;
     general?: {
          properties?: Record<string, any>;
     };
     [key: string]: any;
};

export type WallpaperData = {
     previewPath: string | null;
     projectData: WallpaperProjectData | null;
     previewData: string | undefined;
};

export type Wallpaper = WallpaperData & { folderName: string };
