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
     projectData: WallpaperProjectData | null;
     previewPath: string | undefined;
};

export type Wallpaper = WallpaperData & { folderName: string };

export interface ScreenConfig {
     name: string;
     wallpaper: string | null;
}

export type AppConfig = {
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
     wallpaperEngineDir?: string;
     properties?: Record<string, string>;
     wallpaperProperties?: Record<string, Record<string, string>>;
     dumpStructure?: boolean;
     playlist?: string[];
     steamApiKey?: string;
};

export type PropertyType =
     | "slider"
     | "boolean"
     | "bool"
     | "combolist"
     | "combo"
     | "color"
     | "text"
     | "textinput"
     | "group"
     | "unknown";

export interface WallpaperProperty {
     name: string;
     type: PropertyType;
     description: string;
     value: any;
     min?: number;
     max?: number;
     step?: number;
     options?: Record<string, string>;
}
