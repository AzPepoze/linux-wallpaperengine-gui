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
     dialog,
} from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { EXECUTABLE_NAME } from "../shared/constants";

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

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const isMinimized = process.argv.includes("--minimized");

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
          transparent: true,
          // frame: false,
     });

     win.webContents.on("did-finish-load", () => {
          win?.webContents.send(
               "main-process-message",
               new Date().toLocaleString()
          );
     });

     win.on("close", (event) => {
          if (!isQuitting) {
               event.preventDefault();
               win?.hide();
               return false;
          }
     });

     if (VITE_DEV_SERVER_URL) {
          win.loadURL(VITE_DEV_SERVER_URL);
     } else {
          win.loadFile(path.join(process.env.DIST || "", "index.html"));
     }

     if (isMinimized) {
          win.hide();
     }

     // win.on("ready-to-show", () => {
     //      win?.webContents.openDevTools();
     // });
}

function quit() {
     isQuitting = true;
     spawn("killall -e linux-wallpaperengine", { shell: true, detached: true });
     app.quit();
}

function createTray() {
     const iconPath = path.join(process.env.VITE_PUBLIC || "", "icon.png");
     const icon = nativeImage.createFromPath(iconPath);
     tray = new Tray(icon.resize({ width: 16, height: 16 }));

     const contextMenu = Menu.buildFromTemplate([
          { label: "Show", click: () => win?.show() },
          { label: "Hide", click: () => win?.hide() },
          { type: "separator" },
          {
               label: "Quit",
               click: () => {
                    quit();
               },
          },
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

app.on("window-all-closed", () => {
     if (process.platform !== "darwin") {
          app.quit();
     }
});

app.on("activate", () => {
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

     screen.on("display-added", () => {
          win?.webContents.send("screens-changed");
     });
     screen.on("display-removed", () => {
          win?.webContents.send("screens-changed");
     });
});

ipcMain.handle("app-exit", async () => {
     quit();
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

ipcMain.handle("select-dir", async () => {
     const directory = await dialog.showOpenDialog(win!, {
          properties: ["openDirectory"],
     });

     return directory.filePaths[0];
});

ipcMain.handle("select-file", async () => {
     const file = await dialog.showOpenDialog(win!, {
          properties: ["openFile"],
     });

     return file.filePaths[0];
});

ipcMain.handle(
     "exec-command",
     async (_, command: string, args: string[], show_log: boolean = true) => {
          if (show_log) console.log("Executing:", command, args);

          return new Promise((resolve, reject) => {
               const multipleWhitespaceRegex = /\s+/gi;
               const isExecutableCommand =
                    command.includes(" ") &&
                    command
                         .replace(multipleWhitespaceRegex, " ")
                         .split(" ")[0]
                         .endsWith(EXECUTABLE_NAME);

               if (isExecutableCommand) {
                    const process = spawn(command, args, {
                         shell: true,
                         detached: true,
                    });

                    process.stdout?.on("data", (data) => {
                         const message = data.toString();
                         if (show_log) console.log(`[Engine Out]: ${message}`);
                         win?.webContents.send("wallpaper-log", message);
                    });

                    process.stderr?.on("data", (data) => {
                         const message = data.toString();
                         if (show_log)
                              console.error(`[Engine Error]: ${message}`);
                         win?.webContents.send("wallpaper-log", message);
                    });

                    process.on("error", (err) => {
                         console.error("Failed to start process:", err);
                         reject(err.message);
                    });

                    console.log(`running pid : ${process.pid}`);
                    resolve({ pid: process.pid });
               } else {
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
     return buffer.buffer;
});

ipcMain.handle("fs-exists", async (_, filePath: string) => {
     if (filePath.startsWith("~")) {
          filePath = path.join(app.getPath("home"), filePath.slice(1));
     }
     try {
          await fs.access(filePath);
          return true;
     } catch {
          return false;
     }
});

ipcMain.handle("get-env", async (_, key: string) => {
     return process.env[key];
});

ipcMain.handle("get-home-dir", () => {
     return app.getPath("home");
});
