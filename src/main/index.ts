import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import { spawn, ChildProcess } from 'child_process'

/*
------------------------------------------------------
Global variables
-------------------------------------------------------
*/
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let wallpaperProcess: ChildProcess | null = null

/*
------------------------------------------------------
Create Window
-------------------------------------------------------
*/
function createWindow(): void {
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
    if (mainWindow) mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
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

/*
------------------------------------------------------
Create Tray
-------------------------------------------------------
*/
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
    {
      label: 'Show / Hide App',
      click: toggleWindow
    },
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
App Events
-------------------------------------------------------
*/

import path from 'path'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // Function to set wallpaper
  const setWallpaper = async (wallpaperFolderName: string | null) => {
    try {
      const configPath = path.join(app.getAppPath(), 'config.json')
      const configContent = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)

      const screen = config.SCREEN || 'DP-1'
      const fps = config.FPS || 60
      const silence = config.SILENCE || false

      if (wallpaperProcess) {
        console.log('Killing old wallpaper process...')
        wallpaperProcess.kill()
        wallpaperProcess = null
      }

      if (silence || wallpaperFolderName === null) {
        console.log('Silence mode is active or no wallpaper selected. Not spawning wallpaper process.')
        return { success: true }
      }

      const args = ['-r', screen, '-f', fps.toString(), '-s', wallpaperFolderName]

      console.log(`Spawning command: linux-wallpaperengine ${args.join(' ')}`)

      wallpaperProcess = spawn('linux-wallpaperengine', args, { detached: false, stdio: 'ignore' })
      wallpaperProcess.unref() // Allow the parent process to exit independently

      wallpaperProcess.once('error', (err: unknown) => {
        console.error(
          `Failed to start wallpaper process: ${err instanceof Error ? err.message : String(err)}`
        )
      })

      wallpaperProcess.once('exit', (code, signal) => {
        console.log(`Wallpaper process exited with code ${code} and signal ${signal}`)
      })

      return { success: true }
    } catch (err: unknown) {
      console.error(`Error in setWallpaper: ${err instanceof Error ? err.message : String(err)}`)
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  // -------------------------------------------------------
  // IPC: Get Wallpapers
  // -------------------------------------------------------
  ipcMain.handle('get-wallpapers', async () => {
    try {
      const homePath = app.getPath('home')
      const basePath = path.join(homePath, '.local/share/Steam/steamapps/workshop/content/431960')
      const entries = await fs.readdir(basePath, { withFileTypes: true })

      const wallpapersWithPreviews = await Promise.all(
        entries
          .filter((e) => e.isDirectory())
          .map(async (wallpaperEntry) => {
            const wallpaperPath = path.join(basePath, wallpaperEntry.name)
            let previewPath: string | null = null
            let projectData: any = null

            try {
              const projectJsonPath = path.join(wallpaperPath, 'project.json')
              const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
              projectData = JSON.parse(projectJsonContent)

              if (projectData.preview) {
                const previewFileName = projectData.preview
                const fullPreviewPath = path.join(wallpaperPath, previewFileName)
                const imageBuffer = await fs.readFile(fullPreviewPath)
                const base64Image = imageBuffer.toString('base64')
                const mimeType = previewFileName.toLowerCase().endsWith('.jpg')
                  ? 'image/jpeg'
                  : 'image/gif'
                previewPath = `data:${mimeType};base64,${base64Image}`
              }
            } catch (readJsonError) {
              console.warn(`Could not read project.json for ${wallpaperEntry.name}:`, readJsonError)
            }
            return { folderName: wallpaperEntry.name, previewPath, projectData }
          })
      )
      return { success: true, wallpapers: wallpapersWithPreviews }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // -------------------------------------------------------
  // IPC: Get Config
  // -------------------------------------------------------
  ipcMain.handle('get-config', async () => {
    try {
      const configPath = path.join(app.getAppPath(), 'config.json')
      const configContent = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)
      return { success: true, ...config }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // -------------------------------------------------------
  // IPC: Save Config
  // -------------------------------------------------------
  ipcMain.handle(
    'save-config',
    async (_, newConfig: { SCREEN: string; FPS: number; lastUsedWallpaper?: string; SILENCE?: boolean }) => {
      try {
        const configPath = path.join(app.getAppPath(), 'config.json')
        await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')

        // If a wallpaper was previously set, re-apply it with new settings
        if (newConfig.SILENCE) {
          await setWallpaper(null) // Stop wallpaper if silence is true
        } else if (newConfig.lastUsedWallpaper) {
          await setWallpaper(newConfig.lastUsedWallpaper)
        }

        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  // -------------------------------------------------------
  // IPC: Set Wallpaper
  // -------------------------------------------------------
  ipcMain.handle('set-wallpaper', async (_, wallpaperFolderName: string | null) => {
    return await setWallpaper(wallpaperFolderName)
  })

  createWindow()
  createTray()

  // Auto-set last used wallpaper on app start
  const configPath = path.join(app.getAppPath(), 'config.json')
  try {
    const configContent = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    if (config.lastUsedWallpaper) {
      await setWallpaper(config.lastUsedWallpaper)
    }
  } catch (err) {
    console.error('Failed to read config.json on startup:', err)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {})
