import { ipcMain, dialog, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import { logger } from "../logger";
import { normalizePath } from "../utils/pathHelper";

export function registerFileService() {
	ipcMain.handle("select-dir", async (event) => {
		logger.ipcReceived("select-dir");
		const win = BrowserWindow.fromWebContents(event.sender);
		const directory = await dialog.showOpenDialog(win!, {
			properties: ["openDirectory"],
		});

		return directory.filePaths[0];
	});

	ipcMain.handle("select-file", async (event) => {
		logger.ipcReceived("select-file");
		const win = BrowserWindow.fromWebContents(event.sender);
		const file = await dialog.showOpenDialog(win!, {
			properties: ["openFile"],
		});

		return file.filePaths[0];
	});

	ipcMain.handle("fs-read-dir", async (_, dirPath: string) => {
		logger.ipcReceived("fs-read-dir", dirPath);
		dirPath = normalizePath(dirPath);
		try {
			const entries = await fs.readdir(dirPath, {
				withFileTypes: true,
			});
			return entries.map((e) => ({
				entry: e.name,
				type: e.isDirectory() ? "DIRECTORY" : "FILE",
			}));
		} catch (e: any) {
			logger.error("Error reading dir:", dirPath, e);
			throw e;
		}
	});

	ipcMain.handle("fs-read-file", async (_, filePath: string) => {
		logger.ipcReceived("fs-read-file", filePath);
		filePath = normalizePath(filePath);
		return await fs.readFile(filePath, "utf-8");
	});

	ipcMain.handle(
		"fs-write-file",
		async (_, filePath: string, content: string) => {
			logger.ipcReceived("fs-write-file", filePath);
			filePath = normalizePath(filePath);
			await fs.writeFile(filePath, content, "utf-8");
		},
	);

	ipcMain.handle("fs-read-binary", async (_, filePath: string) => {
		logger.ipcReceived("fs-read-binary", filePath);
		filePath = normalizePath(filePath);
		const buffer = await fs.readFile(filePath);
		return buffer.buffer;
	});

	ipcMain.handle("fs-exists", async (_, filePath: string) => {
		logger.ipcReceived("fs-exists", filePath);
		filePath = normalizePath(filePath);
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	});

	ipcMain.handle("get-directory-size", async (_, dirPath: string) => {
		logger.ipcReceived("get-directory-size", dirPath);
		dirPath = normalizePath(dirPath);
		try {
			// Ensure the path exists
			try {
				await fs.stat(dirPath);
			} catch (err: any) {
				logger.backend(`Directory does not exist: ${dirPath}`, err);
				return 0;
			}

			let total = 0;
			const stack: string[] = [dirPath];

			while (stack.length) {
				const cur = stack.pop()!;
				try {
					const entries = await fs.readdir(cur);
					for (const name of entries) {
						const full = `${cur}/${name}`;
						try {
							const st = await fs.stat(full);
							if (st.isDirectory()) {
								stack.push(full);
							} else {
								total += st.size;
							}
						} catch (err: any) {
							logger.backend(`Error statting ${full}:`, err);
						}
					}
				} catch (err: any) {
					logger.backend(`Error reading directory ${cur}:`, err);
				}
			}

			logger.backend(`Directory size for ${dirPath}: ${total}`);
			return total;
		} catch (e: any) {
			logger.error("Error getting directory size:", dirPath, e);
			return 0;
		}
	});
}
