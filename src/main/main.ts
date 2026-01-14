import {
     app,
     BrowserWindow,
     Tray,
     Menu,
     nativeImage,
     screen,
     protocol,
     net,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerConfigService } from "./services/configService";
import { registerWallpaperService } from "./services/wallpaperService";
import { registerDisplayService } from "./services/displayService";
import { registerLoggerService } from "./services/loggerService";
import { registerWindowService, quit } from "./services/windowService";
import { registerFileService } from "./services/fileService";
import { registerSystemService } from "./services/systemService";
import { setMainWindow, logger } from "../backend/logger";
import {
     applyWallpapers,
     killAllWallpapers,
} from "../backend/wallpaperService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.commandLine.appendSwitch(
     "--disable-features",
     "CalculateNativeWinOcclusion"
);
app.commandLine.appendSwitch("--js-flags", "--max-old-space-size=512");
app.commandLine.appendSwitch("--disable-software-rasterizer");
app.commandLine.appendSwitch("--no-zygote");
app.commandLine.appendSwitch("--no-sandbox");

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

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const isMinimized = process.argv.includes("--minimized");

function createWindow() {
     const preloadPath = path.join(__dirname, "preload.mjs");
     logger.backend("Preload path:", preloadPath);
     win = new BrowserWindow({
          icon: path.join(process.env.VITE_PUBLIC || "", "icon.png"),
          width: 1200,
          height: 800,
          webPreferences: {
               preload: preloadPath,
               contextIsolation: true,
               nodeIntegration: false,
               backgroundThrottling: true,
               spellcheck: false,
          },
          autoHideMenuBar: true,
     });
     setMainWindow(win);
     logger.backend("Window created");

     win.webContents.on("did-finish-load", () => {
          win?.webContents.send(
               "main-process-message",
               new Date().toLocaleString()
          );
     });

     win.on("closed", () => {
          win = null;
          setMainWindow(null);
     });

     if (VITE_DEV_SERVER_URL) {
          win.loadURL(VITE_DEV_SERVER_URL);
     } else {
          win.loadFile(path.join(process.env.DIST || "", "index.html"));
     }
}

function createTray() {
     const iconPath = path.join(process.env.VITE_PUBLIC || "", "icon.png");
     const icon = nativeImage.createFromPath(iconPath);
     tray = new Tray(icon.resize({ width: 16, height: 16 }));

     const contextMenu = Menu.buildFromTemplate([
          {
               label: "Show",
               click: () => {
                    if (!win) createWindow();
                    else win.show();
               },
          },
          {
               label: "Hide",
               click: () => {
                    logger.backend("Window destroyed (via context menu)");
                    win?.close();
               },
          },
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
          if (win) {
               logger.backend("Window destroyed (via tray click)");
               win.close();
          } else {
               createWindow();
          }
     });
}

app.on("window-all-closed", () => {});

app.on("activate", () => {
     if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
     }
});

app.whenReady().then(() => {
     killAllWallpapers();
     registerConfigService();
     registerWallpaperService();
     registerDisplayService();
     registerLoggerService();
     registerWindowService();
     registerFileService();
     registerSystemService();

     protocol.handle("wallpaper", (request) => {
          const url = request.url.replace("wallpaper://", "");
          const filePath = decodeURIComponent(url);
          return net.fetch(`file://${filePath}`);
     });

     screen.on("display-added", () => {
          win?.webContents.send("screens-changed");
     });
     screen.on("display-removed", () => {
          win?.webContents.send("screens-changed");
     });

     createTray();
     applyWallpapers();
     logger.backend("Is minimized:", isMinimized);
     if (!isMinimized) createWindow();
});
