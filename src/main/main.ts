import {
     app,
     BrowserWindow,
     ipcMain,
     Tray,
     Menu,
     nativeImage,
     screen,
     protocol,
     net,
} from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

protocol.registerSchemesAsPrivileged([
     {
          scheme: "wallpaper",
          privileges: { bypassCSP: true, stream: true, supportFetchAPI: true },
     },
]);

process.env.DIST = path.join(__dirname, "../");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
     ? path.join(process.env.DIST, "../public")
     : process.env.DIST;

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
     const preloadPath = path.join(__dirname, "preload.mjs");
     console.log("Preload path:", preloadPath);
     win = new BrowserWindow({
          icon: path.join(process.env.VITE_PUBLIC || "", "icon.png"),
          width: 1200,
          height: 800,
          webPreferences: {
               preload: preloadPath,
               contextIsolation: true,
               nodeIntegration: false,
          },
          autoHideMenuBar: true,
     });

     // Test active push message to Renderer-process
     win.webContents.on("did-finish-load", () => {
          win?.webContents.send(
               "main-process-message",
               new Date().toLocaleString()
          );
     });

     win.on('close', (event) => {
          if (!isQuitting) {
               event.preventDefault();
               win?.hide();
               return false;
          }
     });

     if (VITE_DEV_SERVER_URL) {
          win.loadURL(VITE_DEV_SERVER_URL);
          // win.webContents.openDevTools()
     } else {
          // win.loadFile('dist/index.html')
          win.loadFile(path.join(process.env.DIST || "", "index.html"));
     }
}

function createTray() {
     const iconPath = path.join(process.env.VITE_PUBLIC || "", "icon.png");
     const icon = nativeImage.createFromPath(iconPath);
     tray = new Tray(icon.resize({ width: 16, height: 16 }));

     const contextMenu = Menu.buildFromTemplate([
          { label: "Show", click: () => win?.show() },
          { label: "Hide", click: () => win?.hide() },
          { type: "separator" },
          { label: "Quit", click: () => {
               isQuitting = true;
               app.quit();
          }},
     ]);

     tray.setToolTip("Linux Wallpaper Engine");
     tray.setContextMenu(contextMenu);

     tray.on("click", () => {
          if (win?.isVisible()) {
               win.hide();
          } else {
               win?.show();
          }
     });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
     if (process.platform !== "darwin") {
          app.quit();
     }
});

app.on("activate", () => {
     // On OS X it's common to re-create a window in the app when the
     // dock icon is clicked and there are no other windows open.
     if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
     }
});

app.whenReady().then(() => {
     protocol.handle("wallpaper", (request) => {
          const url = request.url.replace("wallpaper://", "");
          const filePath = decodeURIComponent(url);
          return net.fetch(`file://${filePath}`);
     });

     createWindow();
     createTray();
});

// IPC Handlers
ipcMain.handle("app-exit", async () => {
     isQuitting = true;
     // Kill all running wallpaper engine processes
     await window.electronAPI.execCommand("killall linux-wallpaperengine", [], false); // Don't log this kill command
     app.quit();
});

ipcMain.handle("window-minimize", () => {
     win?.minimize();
});

ipcMain.handle("window-maximize", () => {
     if (win?.isMaximized()) {
          win.unmaximize();
     } else {
          win?.maximize();
     }
});

ipcMain.handle("window-hide", () => {
     win?.hide();
});

ipcMain.handle("get-screens", async () => {
     return screen.getAllDisplays();
});

ipcMain.handle(
     "exec-command",
     async (_, command: string, args: string[], show_log: boolean = true) => {
          if (show_log) console.log("Executing:", command, args);

          return new Promise((resolve, reject) => {
               if (command.startsWith("linux-wallpaperengine")) {
                    const process = spawn(command, args, {
                         shell: true,
                         detached: true,
                    });

                    // process.stdout?.on('data', (data) => { if (show_log) console.log(`[Engine]: ${data}`) });
                    // process.stderr?.on('data', (data) => { if (show_log) console.error(`[Engine Error]: ${data}`) });

                    process.on("error", (err) => {
                         console.error("Failed to start process:", err);
                         reject(err.message);
                    });

                    console.log(`running pid : ${process.pid}`);
                    resolve({ pid: process.pid });
               } else {
                    // General command execution (like xrandr or kill/killall)
                    const proc = spawn(command, args, { shell: true });
                    let stdout = "";
                    let stderr = "";

                    proc.stdout.on("data", (data) => {
                         const chunk = data.toString();
                         if (show_log) console.log(`[CMD Out]: ${chunk}`);
                         stdout += chunk;
                    });
                    proc.stderr.on("data", (data) => {
                         const chunk = data.toString();
                         if (show_log) console.error(`[CMD Err]: ${chunk}`);
                         stderr += chunk;
                    });

                    proc.on("close", (code) => {
                         if (code === 0) {
                              resolve({ stdout, stderr });
                         } else {
                              // Resolve with error info instead of rejecting, so frontend can handle exit codes
                              resolve({
                                   stdout,
                                   stderr,
                                   exitCode: code,
                                   error: `Exited with code ${code}`,
                              });
                         }
                    });

                    proc.on("error", (err) => {
                         reject(err.message);
                    });
               }
          });
     }
);

ipcMain.handle("fs-read-dir", async (_, dirPath: string) => {
     // Resolve ~ to home dir
     if (dirPath.startsWith("~")) {
          dirPath = path.join(app.getPath("home"), dirPath.slice(1));
     }
     try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          return entries.map((e) => ({
               entry: e.name,
               type: e.isDirectory() ? "DIRECTORY" : "FILE",
          }));
     } catch (e: any) {
          console.error("Error reading dir:", dirPath, e);
          throw e;
     }
});

ipcMain.handle("fs-read-file", async (_, filePath: string) => {
     if (filePath.startsWith("~")) {
          filePath = path.join(app.getPath("home"), filePath.slice(1));
     }
     return await fs.readFile(filePath, "utf-8");
});

ipcMain.handle(
     "fs-write-file",
     async (_, filePath: string, content: string) => {
          if (filePath.startsWith("~")) {
               filePath = path.join(app.getPath("home"), filePath.slice(1));
          }
          await fs.writeFile(filePath, content, "utf-8");
     }
);

ipcMain.handle("fs-read-binary", async (_, filePath: string) => {
     if (filePath.startsWith("~")) {
          filePath = path.join(app.getPath("home"), filePath.slice(1));
     }
     const buffer = await fs.readFile(filePath);
     return buffer.buffer; // Return ArrayBuffer
});

ipcMain.handle("get-env", async (_, key: string) => {
     return process.env[key];
});

ipcMain.handle("get-home-dir", () => {
     return app.getPath("home");
});
