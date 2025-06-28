import { contextBridge } from 'electron'
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
  saveConfig: async (config: { SCREEN: string; FPS: number }) => {
    try {
      return await electronAPI.ipcRenderer.invoke('save-config', config)
    } catch (e) {
      return { success: false, error: 'IPC not available' }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
