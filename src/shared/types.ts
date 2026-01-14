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

export interface ScreenConfig {
     name: string;
     wallpaper: string | null;
}

export interface AppConfig {
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
     cloneMode?: boolean;
     globalWallpaper?: string | null;
     // New options
     fullscreenPauseOnlyActive?: boolean;
     fullscreenPauseIgnoreAppIds?: string[];
     screenshot?: string;
     screenshotDelay?: number;
     assetsDir?: string;
     properties?: Record<string, string>;
     dumpStructure?: boolean;
     playlist?: string[];
}
