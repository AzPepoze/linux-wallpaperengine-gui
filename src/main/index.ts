import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import { spawn, ChildProcess, exec } from 'child_process'
import { autoUpdater } from 'electron-updater'

/*
------------------------------------------------------
Global Variables & State
-------------------------------------------------------
*/

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let wallpaperProcess: ChildProcess | null = null
const configPath = join(app.getPath('userData'), 'config.json')
let isFirstLaunch = true

interface AppConfig {
     SCREEN?: string
     FPS?: number
     SILENCE?: boolean
     lastUsedWallpaper?: string | null
}

/*
------------------------------------------------------
Core Application Setup
-------------------------------------------------------
*/

function createWindow(): void {
     const shouldStartMinimized = process.argv.includes('--minimized') && isFirstLaunch
     isFirstLaunch = false

     mainWindow = new BrowserWindow({
          width: 900,
          height: 670,
          show: false,
          autoHideMenuBar: true,
          ...(process.platform === 'linux' ? { icon } : {}),
          webPreferences: {
               preload: join(__dirname, '../preload/index.js'),
               sandbox: false
          }
     })

     mainWindow.on('ready-to-show', () => {
          if (!shouldStartMinimized) {
               mainWindow?.show()
          }
     })

     mainWindow.on('closed', () => {
          mainWindow = null
     })

     //-------------------------------------------------------
     // Auto Updater Events
     //-------------------------------------------------------
     // Forward events to the renderer process.
     // These events are checked and sent to the UI when a new version is available.
     autoUpdater.on('update-available', () => {
          // Make sure the window is still open before sending.
          mainWindow?.webContents.send('update-available')
     })

     autoUpdater.on('update-downloaded', () => {
          // Make sure the window is still open before sending.
          mainWindow?.webContents.send('update-downloaded')
     })

     mainWindow.webContents.setWindowOpenHandler((details) => {
          shell.openExternal(details.url)
          return { action: 'deny' }
     })

     if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
          mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
     } else {
          mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
     }
}

function createTray(): void {
     tray = new Tray(icon)

     const toggleWindow = (): void => {
          if (mainWindow && !mainWindow.isDestroyed()) {
               mainWindow.close()
          } else {
               createWindow()
          }
     }

     const contextMenu = Menu.buildFromTemplate([
          { label: 'Show / Hide App', click: toggleWindow },
          { type: 'separator' },
          {
               label: 'Quit',
               click: () => {
                    app.quit()
               }
          }
     ])

     tray.setToolTip('Wallpaper Engine GUI')
     tray.setContextMenu(contextMenu)
     tray.on('click', toggleWindow)
}

/*
------------------------------------------------------
Configuration Management
-------------------------------------------------------
*/

async function readConfig(): Promise<AppConfig> {
     try {
          const configContent = await fs.readFile(configPath, 'utf-8')
          return JSON.parse(configContent)
     } catch (err) {
          console.warn('Could not read config.json, returning default. Error:', err)
          return {}
     }
}

async function writeConfig(newConfig: AppConfig): Promise<void> {
     await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')
}

/*
------------------------------------------------------
Wallpaper Process Management
-------------------------------------------------------
*/

var kill = require('tree-kill')

async function killWallpaperProcess() {
     if (wallpaperProcess && !wallpaperProcess.killed) {
          try {
               kill(wallpaperProcess.pid)
               console.log('Successfully killed previous wallpaper process.')
          } catch (killError) {
               console.error('Failed to kill wallpaper process:', killError)
          }
          wallpaperProcess = null
     }
}

async function killAllWallpaperProcesses() {
     exec('pkill -f linux-wallpaperengine')
}

async function manageWallpaper(
     wallpaperFolderName: string | null
): Promise<{ success: boolean; error?: string }> {
     try {
          await killWallpaperProcess()

          const config = await readConfig()
          const screen = config.SCREEN || 'DP-1'
          const fps = config.FPS || 60
          const isSilenced = config.SILENCE || false

          const shouldSpawn = wallpaperFolderName !== null || isSilenced
          if (!shouldSpawn) {
               await writeConfig({ ...config, lastUsedWallpaper: null })
               return { success: true }
          }

          const args: string[] = ['-r', screen, '-f', fps.toString()]
          if (isSilenced) {
               args.push('-s')
          }
          if (wallpaperFolderName) {
               args.push(wallpaperFolderName)
               await writeConfig({ ...config, lastUsedWallpaper: wallpaperFolderName })
          }

          console.log(`Spawning command: linux-wallpaperengine ${args.join(' ')}`)

          wallpaperProcess = spawn('linux-wallpaperengine', args, {
               detached: false,
               stdio: 'ignore'
          })

          wallpaperProcess.once('error', (err: Error) => {
               console.error(`Failed to start wallpaper process: ${err.message}`)
          })

          wallpaperProcess.once('exit', (code, signal) => {
               console.log(`Wallpaper process exited with code ${code} and signal ${signal}`)
          })

          return { success: true }
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err)
          console.error(`Error in manageWallpaper: ${error}`)
          return { success: false, error }
     }
}

/*
------------------------------------------------------
IPC Handlers Setup
-------------------------------------------------------
*/

function registerIpcHandlers(): void {
     ipcMain.handle('get-wallpapers', async () => {
          try {
               const homePath = app.getPath('home')
               const basePath = resolve(
                    homePath,
                    '.local/share/Steam/steamapps/workshop/content/431960'
               )
               const entries = await fs.readdir(basePath, { withFileTypes: true })

               const wallpapers = await Promise.all(
                    entries
                         .filter((e) => e.isDirectory())
                         .map(async (entry) => {
                              const wallpaperPath = join(basePath, entry.name)
                              const projectJsonPath = join(wallpaperPath, 'project.json')
                              let previewPath: string | null = null
                              let projectData: any = {}

                              try {
                                   const projectJsonContent = await fs.readFile(
                                        projectJsonPath,
                                        'utf-8'
                                   )
                                   projectData = JSON.parse(projectJsonContent)

                                   if (projectData.preview) {
                                        const fullPreviewPath = join(
                                             wallpaperPath,
                                             projectData.preview
                                        )
                                        const imageBuffer = await fs.readFile(fullPreviewPath)
                                        const mimeType = projectData.preview
                                             .toLowerCase()
                                             .endsWith('.jpg')
                                             ? 'image/jpeg'
                                             : 'image/gif'
                                        previewPath = `data:${mimeType};base64,${imageBuffer.toString('base64')}`
                                   }
                              } catch (readError) {
                                   console.warn(
                                        `Could not process project.json for ${entry.name}:`,
                                        readError
                                   )
                              }
                              return { folderName: entry.name, previewPath, projectData }
                         })
               )
               return { success: true, wallpapers }
          } catch (err: unknown) {
               const error = err instanceof Error ? err.message : String(err)
               return { success: false, error }
          }
     })

     ipcMain.handle('get-config', async () => {
          try {
               const config = await readConfig()
               return { success: true, ...config }
          } catch (err: unknown) {
               const error = err instanceof Error ? err.message : String(err)
               return { success: false, error }
          }
     })

     ipcMain.handle('save-config', async (_, newConfig: AppConfig) => {
          try {
               const currentConfig = await readConfig()
               const updatedConfig = { ...currentConfig, ...newConfig }
               await writeConfig(updatedConfig)
               await manageWallpaper(updatedConfig.lastUsedWallpaper || null)
               return { success: true }
          } catch (err: unknown) {
               const error = err instanceof Error ? err.message : String(err)
               return { success: false, error }
          }
     })

     ipcMain.handle('set-wallpaper', async (_, wallpaperFolderName: string | null) => {
          return await manageWallpaper(wallpaperFolderName)
     })

     ipcMain.handle('open-config-in-editor', async () => {
          try {
               await shell.openPath(configPath)
               return { success: true }
          } catch (err: unknown) {
               const error = err instanceof Error ? err.message : String(err)
               return { success: false, error }
          }
     })

     // Listen for the command from the UI to restart and update
     ipcMain.on('restart-and-update', () => {
          autoUpdater.quitAndInstall()
     })
}

/*
------------------------------------------------------
Application Lifecycle
-------------------------------------------------------
*/

app.whenReady().then(async () => {
     electronApp.setAppUserModelId('com.electron')

     app.on('browser-window-created', (_, window) => {
          optimizer.watchWindowShortcuts(window)
     })

     registerIpcHandlers()
     createWindow()

     // Check for updates after the window has been created.
     autoUpdater.checkForUpdatesAndNotify()

     createTray()

     try {
          const config = await readConfig()
          if (config.lastUsedWallpaper) {
               await manageWallpaper(config.lastUsedWallpaper)
          }
     } catch (err) {
          console.error('Failed to set initial wallpaper on startup:', err)
     }

     app.on('activate', () => {
          if (BrowserWindow.getAllWindows().length === 0) {
               createWindow()
          }
     })
})

app.on('before-quit', killAllWallpaperProcesses)

app.on('window-all-closed', () => {})
