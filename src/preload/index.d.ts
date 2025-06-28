import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getWallpapers: () => Promise<{ success: boolean; wallpapers?: { folderName: string; previewPath: string | null; projectData: any }[]; error?: string }>,
      setWallpaper: (wallpaperFolderName: string | null) => Promise<{ success: boolean; error?: string }>,
      getConfig: () => Promise<{ success: boolean; SCREEN?: string; FPS?: number; lastUsedWallpaper?: string; SILENCE?: boolean; error?: string }>,
      saveConfig: (config: { SCREEN: string; FPS: number; lastUsedWallpaper?: string; SILENCE?: boolean }) => Promise<{ success: boolean; error?: string }>
    }
  }
}
