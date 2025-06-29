import { ElectronAPI } from '@electron-toolkit/preload'

// A generic type for API responses to reduce repetition and improve maintainability.
type ApiResponse<T = object> = Promise<{ success: boolean; error?: string } & T>

declare global {
     interface Window {
          electron: ElectronAPI
          api: {
               getWallpapers: () => ApiResponse<{
                    wallpapers?: {
                         folderName: string
                         previewPath: string | null
                         projectData: any
                    }[]
               }>
               setWallpaper: (wallpaperFolderName: string | null) => ApiResponse
               getConfig: () => ApiResponse<{
                    SCREEN?: string
                    FPS?: number
                    SILENCE?: boolean
                    lastUsedWallpaper?: string | null
               }>
               saveConfig: (config: {
                    SCREEN: string
                    FPS: number
                    SILENCE: boolean
               }) => ApiResponse
               openConfigInEditor: () => ApiResponse
          }
          updater: {
               onUpdateAvailable: (callback: () => void) => () => void
               onUpdateDownloaded: (callback: () => void) => () => void
               restartAndUpdate: () => void
          }
     }
}
