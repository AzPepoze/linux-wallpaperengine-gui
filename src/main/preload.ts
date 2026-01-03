import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
     on: (channel: string, callback: (data: any) => void) => {
          ipcRenderer.on(channel, (_, data) => callback(data));
     },
     exit: () => ipcRenderer.invoke("app-exit"),
     minimize: () => ipcRenderer.invoke("window-minimize"),
     maximize: () => ipcRenderer.invoke("window-maximize"),
     hide: () => ipcRenderer.invoke("window-hide"),
     getScreens: () => ipcRenderer.invoke("get-screens"),
     execCommand: (
          command: string,
          args: string[] = [],
          show_log: boolean = true
     ) => ipcRenderer.invoke("exec-command", command, args, show_log),
     readDirectory: (path: string) => ipcRenderer.invoke("fs-read-dir", path),
     readFile: (path: string) => ipcRenderer.invoke("fs-read-file", path),
     writeFile: (path: string, content: string) =>
          ipcRenderer.invoke("fs-write-file", path, content),
     readBinaryFile: (path: string) =>
          ipcRenderer.invoke("fs-read-binary", path),
     getEnv: (key: string) => ipcRenderer.invoke("get-env", key),
     getHomeDir: () => ipcRenderer.invoke("get-home-dir"),
     selectDir: () => ipcRenderer.invoke("select-dir")
});
