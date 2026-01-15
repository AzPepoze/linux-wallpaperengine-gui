import { app, BrowserWindow, protocol, net } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { socketClient } from "./socket-client";
import { registerConfigService } from "./services/configService";
import { registerWallpaperService } from "./services/wallpaperService";
import { registerDisplayService } from "./services/displayService";
import { registerLoggerService } from "./services/loggerService";
import { registerWindowService } from "./services/windowService";
import { registerFileService } from "./services/fileService";
import { registerSystemService } from "./services/systemService";
import { setMainWindow, logger } from "./logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function killAllWallpapers() {
     try {
          await socketClient.send("kill-all-wallpapers");
     } catch (err) {
          logger.backend("Error calling kill-all-wallpapers:", err);
     }
}

async function applyWallpapers() {
     try {
          await socketClient.send("apply-wallpapers");
     } catch (err) {
          logger.backend("Error calling apply-wallpapers:", err);
     }
}

app.commandLine.appendSwitch("--js-flags", "--max-old-space-size=512");
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
let cachedWallpaperBasePath = "";

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
               offscreen: false,
               enableWebSQL: false,
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

app.on("window-all-closed", () => {
     app.quit();
});

app.on("activate", () => {
     if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
     }
});

app.whenReady().then(async () => {
     try {
          await socketClient.connect();
          logger.backend("Connected to Go backend");

          socketClient.onEvent((method, params) => {
               if (method === "log") {
                    const { type, message } = params;
                    logger.toFrontend(type || "backend", message);
               } else if (method === "screens-changed") {
                    win?.webContents.send("screens-changed");
               }
          });

          // Cache base path immediately to avoid spamming the backend later
          cachedWallpaperBasePath = await socketClient.send(
               "get-wallpaper-base-path"
          );
     } catch (err) {
          logger.backend(
               "Failed to connect or get base path from Go backend:",
               err
          );
     }

     killAllWallpapers();
     registerConfigService();
     registerWallpaperService();
     registerDisplayService();
     registerLoggerService();
     registerWindowService();
     registerFileService();
     registerSystemService();

     protocol.handle("wallpaper", async (request) => {
          const url = request.url.replace("wallpaper://", "");
          const filePath = decodeURIComponent(url);

          if (!cachedWallpaperBasePath) {
               try {
                    cachedWallpaperBasePath = await socketClient.send(
                         "get-wallpaper-base-path"
                    );
               } catch (err) {
                    logger.backend(
                         "Error getting wallpaper base path in handler:",
                         err
                    );
                    return new Response("Internal Server Error", {
                         status: 500,
                    });
               }
          }

          if (!filePath.startsWith(cachedWallpaperBasePath)) {
               logger.backend(
                    `Blocked wallpaper:// access to: ${filePath} (not in ${cachedWallpaperBasePath})`
               );
               return new Response("Access Denied", { status: 403 });
          }

          return net.fetch(`file://${filePath}`);
     });

     applyWallpapers();
     logger.backend("Is minimized:", isMinimized);
     if (!isMinimized) createWindow();
});
