import { ipcMain, app, shell } from "electron";
import { logger } from "../logger";

export function registerSystemService() {
	ipcMain.handle("get-env", async (_, key: string) => {
		logger.ipcReceived("get-env", key);
		return process.env[key];
	});

	ipcMain.handle("get-home-dir", () => {
		logger.ipcReceived("get-home-dir");
		return app.getPath("home");
	});

	ipcMain.handle("open-external", async (_, url: string) => {
		logger.ipcReceived("open-external", url);
		await shell.openExternal(url);
	});

	ipcMain.handle("open-path", async (_, path: string) => {
		logger.ipcReceived("open-path", path);
		return await shell.openPath(path);
	});
}
