import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
     getWallpapers: async () => {
          try {
               return await electronAPI.ipcRenderer.invoke('get-wallpapers')
          } catch (e) {
               return { success: false, error: 'IPC not available' }
          }
     },
     setWallpaper: async (wallpaperFolderName: string) => {
          try {
               return await electronAPI.ipcRenderer.invoke('set-wallpaper', wallpaperFolderName)
          } catch (e) {
               return { success: false, error: 'IPC not available' }
          }
     },
     getConfig: async () => {
          try {
               return await electronAPI.ipcRenderer.invoke('get-config')
          } catch (e) {
               return { success: false, error: 'IPC not available' }
          }
     },
     saveConfig: async (config: { SCREEN: string; FPS: number; SILENCE: boolean }) => {
          try {
               return await electronAPI.ipcRenderer.invoke('save-config', config)
          } catch (e) {
               return { success: false, error: 'IPC not available' }
          }
     },
     openConfigInEditor: async () => {
          try {
               return await electronAPI.ipcRenderer.invoke('open-config-in-editor')
          } catch (e) {
               return { success: false, error: 'IPC not available' }
          }
     }
}

const updaterApi = {
     onUpdateAvailable: (callback: () => void) => {
          ipcRenderer.on('update-available', callback)
          // Return a cleanup function to be called on component unmount
          return () => ipcRenderer.removeListener('update-available', callback)
     },
     onUpdateDownloaded: (callback: () => void) => {
          ipcRenderer.on('update-downloaded', callback)
          // Return a cleanup function
          return () => ipcRenderer.removeListener('update-downloaded', callback)
     },
     restartAndUpdate: () => {
          ipcRenderer.send('restart-and-update')
     }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
