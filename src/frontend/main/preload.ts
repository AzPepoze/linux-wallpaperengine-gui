import { ipcRenderer, contextBridge } from "electron";
import { IPC_LOG_CHANNEL } from "../shared/constants";

const createInvokeMethod =
     (channel: string) =>
     (...args: any[]) =>
          ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld("electronAPI", {
     on: (channel: string, callback: (data: any) => void) => {
          ipcRenderer.on(channel, (_, data) => callback(data));
     },

     sendLog: (type: string, ...args: any[]) =>
          ipcRenderer.send(IPC_LOG_CHANNEL, type, ...args),

     // Window controls
     exit: createInvokeMethod("app-exit"),
     minimize: createInvokeMethod("window-minimize"),
     maximize: createInvokeMethod("window-maximize"),
     hide: createInvokeMethod("window-hide"),

     // System
     getScreens: createInvokeMethod("get-screens"),
     getEnv: createInvokeMethod("get-env"),
     getHomeDir: createInvokeMethod("get-home-dir"),
     selectDir: createInvokeMethod("select-dir"),
     selectFile: createInvokeMethod("select-file"),
     openExternal: createInvokeMethod("open-external"),

     // File system
     readDirectory: createInvokeMethod("fs-read-dir"),
     readFile: createInvokeMethod("fs-read-file"),
     writeFile: createInvokeMethod("fs-write-file"),
     readBinaryFile: createInvokeMethod("fs-read-binary"),
     fsExists: createInvokeMethod("fs-exists"),

     // Config services
     getConfig: createInvokeMethod("get-config"),
     readConfig: createInvokeMethod("read-config"),
     saveConfig: createInvokeMethod("save-config"),
     writeConfig: createInvokeMethod("write-config"),
     openConfigInEditor: createInvokeMethod("open-config-editor"),
     getWallpaperExecutableLocation: createInvokeMethod(
          "get-wallpaper-executable",
     ),
     validateExecutable: createInvokeMethod("validate-executable"),

     // Wallpaper services
     applyWallpapers: createInvokeMethod("apply-wallpapers"),
     setWallpaper: createInvokeMethod("set-wallpaper"),
     toggleCloneMode: createInvokeMethod("toggle-clone-mode"),
     clearAllWallpapers: createInvokeMethod("clear-all-wallpapers"),
     loadWallpapers: createInvokeMethod("load-wallpapers"),
     getWallpaperPreview: createInvokeMethod("get-wallpaper-preview"),
     getWallpaperProjectData: createInvokeMethod("get-wallpaper-project-data"),
     getWallpaperProperties: createInvokeMethod("get-wallpaper-properties"),
     saveWallpaperProperty: createInvokeMethod("save-wallpaper-property"),

     // Workshop services
     getPublishedFileDetails: createInvokeMethod("get-published-file-details"),
     getCollectionDetails: createInvokeMethod("get-collection-details"),
     getUGCFileDetails: createInvokeMethod("get-ugc-file-details"),
     queryWorkshopFiles: createInvokeMethod("query-workshop-files"),
});
