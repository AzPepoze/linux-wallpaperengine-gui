import { app, BrowserWindow, protocol, net } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { socketClient } from "./socket-client";
import { registerConfigService } from "./services/configService";
import { registerWallpaperService } from "./services/wallpaperService";
import { registerDisplayService } from "./services/displayService";
import { registerLoggerService } from "./services/loggerService";
import { registerWindowService } from "./services/windowService";
import { registerFileService } from "./services/fileService";
import { registerSystemService } from "./services/systemService";
import { setMainWindow, logger } from "./logger";
import { registerWorkshopService } from "./services/workshopService";
import { registerImageService } from "./services/imageService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const isDebug = process.argv.includes("--debug-mode");

function createWindow(transparentUi = true) {
	const preloadPath = path.join(__dirname, "preload.mjs");
	logger.backend("Preload path:", preloadPath);
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC || "", "icon.png"),
		width: 1200,
		height: 800,
		transparent: transparentUi,
		backgroundColor: transparentUi ? '#00000000' : '#1d1d1d',
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
	logger.backend("Window created with transparent:", transparentUi);

	win.webContents.on("did-finish-load", () => {
		win?.webContents.send(
			"main-process-message",
			new Date().toLocaleString(),
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
	if (!process.env.INTERNAL_START && !process.env.VITE_DEV_SERVER_URL) {
		const isProduction = !process.env.VITE_DEV_SERVER_URL;
		let backendPath = "";

		if (isProduction) {
			backendPath = path.join(
				process.resourcesPath,
				"linux-wallpaperengine-gui",
			);
		} else {
			backendPath = path.join(
				__dirname,
				"../../../build/backend/linux-wallpaperengine-gui",
			);
		}

		const args = process.argv.slice(isProduction ? 1 : 2);
		logger.backend(
			"Starting Go backend from Electron:",
			backendPath,
			args,
		);

		spawn(backendPath, args, {
			detached: true,
			stdio: isDebug ? ["ignore", "inherit", "inherit"] : "ignore",
			env: process.env,
		}).unref();

		if (!isDebug) app.quit();
		return;
	}

	socketClient.onRetry((attempt, _error) => {
		// Use different levels based on attempt
		let type: "info" | "warn" | "error" = "info";
		if (attempt > 7) type = "error";
		else if (attempt > 3) type = "warn";

		win?.webContents.send("show-toast", {
			message: `Connecting to backend (Attempt ${attempt}/10)...`,
			type,
		});
	});

	try {
		await socketClient.connect();
		logger.backend("Connected to Go backend");

		socketClient.onEvent((method, params) => {
			if (method === "log") {
				const { type, message } = params;
				logger.toFrontend(type || "backend", message);
			} else if (method === "screens-changed") {
				win?.webContents.send("screens-changed");
			} else if (method === "wallpaper-folder-changed") {
				win?.webContents.send("wallpaper-folder-changed", params);
			}
		});

		// Cache base path immediately to avoid spamming the backend later
		cachedWallpaperBasePath = await socketClient.send(
			"get-wallpaper-base-path",
		);

		// Watch wallpaper folder for changes
		if (cachedWallpaperBasePath && fs.existsSync(cachedWallpaperBasePath)) {
			let debounceTimer: NodeJS.Timeout | null = null;
			const debounceDelay = 500;

			fs.watch(cachedWallpaperBasePath, { recursive: true }, (eventType, filename) => {
				if (!filename) return;
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					logger.backend(`Wallpaper folder changed: ${eventType} - ${filename}`);
					win?.webContents.send("wallpaper-folder-changed", {
						path: filename,
						op: eventType,
					});
				}, debounceDelay);
			});
			logger.backend(`Started watching wallpaper directory: ${cachedWallpaperBasePath}`);
		}
	} catch (err) {
		logger.backend(
			"Failed to connect or get base path from Go backend:",
			err,
		);
	}

	let transparentUi = true;
	try {
		const configResult = await socketClient.send("get-config");
		if (configResult && configResult.transparentUi !== undefined) {
			transparentUi = configResult.transparentUi;
		}
	} catch (err) {
		logger.backend("Error getting config in Electron main process:", err);
	}

	registerConfigService();
	registerWallpaperService();
	registerDisplayService();
	registerLoggerService();
	registerWindowService();
	registerFileService();
	registerSystemService();
	registerWorkshopService();
	registerImageService();

	protocol.handle("wallpaper", async (request) => {
		const url = request.url.replace("wallpaper://", "");
		const filePath = decodeURIComponent(url);

		if (!cachedWallpaperBasePath) {
			try {
				cachedWallpaperBasePath = await socketClient.send(
					"get-wallpaper-base-path",
				);
			} catch (err) {
				logger.backend(
					"Error getting wallpaper base path in handler:",
					err,
				);
				return new Response("Internal Server Error", {
					status: 500,
				});
			}
		}

		if (!filePath.startsWith(cachedWallpaperBasePath)) {
			logger.backend(
				`Blocked wallpaper:// access to: ${filePath} (not in ${cachedWallpaperBasePath})`,
			);
			return new Response("Access Denied", { status: 403 });
		}

		return net.fetch(`file://${filePath}`);
	});

	logger.backend("Is minimized:", isMinimized);
	if (!isMinimized) createWindow(transparentUi);
});
