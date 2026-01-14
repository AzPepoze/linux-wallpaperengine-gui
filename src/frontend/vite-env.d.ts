/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ElectronAPI {
     // Event handling
     on: (channel: string, callback: (data: any) => void) => void;
     sendLog: (type: string, ...args: any[]) => void;

     // Window controls
     exit: () => Promise<void>;
     minimize: () => Promise<void>;
     maximize: () => Promise<void>;
     hide: () => Promise<void>;

     // Screen management
     getScreens: () => Promise<{ success: boolean; screens?: string[]; error?: string }>;

     // System operations
     execCommand: (command: string, args?: string[], show_log?: boolean) => Promise<any>;
     getEnv: (key: string) => Promise<string | undefined>;
     getHomeDir: () => Promise<string>;

     // File system operations
     readDirectory: (path: string) => Promise<{ entry: string; type: "DIRECTORY" | "FILE" }[]>;
     readFile: (path: string) => Promise<string>;
     writeFile: (path: string, content: string) => Promise<void>;
     readBinaryFile: (path: string) => Promise<ArrayBuffer>;
     fsExists: (path: string) => Promise<boolean>;
     selectDir: () => Promise<string>;
     selectFile: () => Promise<string>;

     // Configuration management
     getConfig: () => Promise<any>;
     readConfig: () => Promise<any>;
     saveConfig: (newConfig: any) => Promise<{ success: boolean; error?: string }>;
     writeConfig: (newConfig: any) => Promise<void>;
     openConfigInEditor: () => Promise<{ success: boolean; error?: string }>;
     getWallpaperExecutableLocation: () => Promise<string>;
     validateExecutable: () => Promise<boolean>;

     // Wallpaper management
     applyWallpapers: () => Promise<{ success: boolean; error?: string }>;
     setWallpaper: (screenName: string, wallpaperFolderName: string | null) => Promise<{ success: boolean; error?: string }>;
     toggleCloneMode: (enabled: boolean, globalWallpaper?: string | null) => Promise<{ success: boolean; error?: string }>;
     clearAllWallpapers: () => Promise<{ success: boolean; error?: string }>;
     loadWallpapers: () => Promise<{ wallpapers: Record<string, any>; error: string | null; selectedWallpaper: any | null }>;
     getWallpaperPreview: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
}

interface Window {
     electronAPI: ElectronAPI;
}
