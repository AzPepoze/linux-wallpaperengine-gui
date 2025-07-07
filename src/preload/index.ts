import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

//-------------------------------------------------------
// Helper Functions
//-------------------------------------------------------

const createIpcCaller = (channel: string) => {
     return async (...args: any[]) => {
          try {
               return await ipcRenderer.invoke(channel, ...args)
          } catch (e) {
               console.error(`Error invoking IPC channel '${channel}':`, e)
               return { success: false, error: 'IPC call failed' }
          }
     }
}

const createIpcListener = (channel: string) => {
     return (callback: (...args: any[]) => void) => {
          ipcRenderer.on(channel, (_event, ...args) => callback(...args))
          return () => ipcRenderer.removeListener(channel, callback)
     }
}

//-------------------------------------------------------
// API Definition
//-------------------------------------------------------

const api = {
     getWallpapers: createIpcCaller('get-wallpapers'),
     setWallpaper: createIpcCaller('set-wallpaper'),
     getConfig: createIpcCaller('get-config'),
     saveConfig: createIpcCaller('save-config'),
     openConfigInEditor: createIpcCaller('open-config-in-editor')
}

const updaterApi = {
     onUpdateAvailable: createIpcListener('update-available'),
     onUpdateDownloaded: createIpcListener('update-downloaded'),
     restartAndUpdate: () => {
          ipcRenderer.send('restart-and-update')
     }
}

//-------------------------------------------------------
// Context Bridge
//-------------------------------------------------------

if (process.contextIsolated) {
     try {
          contextBridge.exposeInMainWorld('electron', electronAPI)
          contextBridge.exposeInMainWorld('api', api)
          contextBridge.exposeInMainWorld('updater', updaterApi)
     } catch (error) {
          console.error(error)
     }
} else {
     // @ts-ignore (define in dts)
     window.electron = electronAPI
     // @ts-ignore (define in dts)
     window.api = api
     // @ts-ignore (define in dts)
     window.updater = updaterApi
}