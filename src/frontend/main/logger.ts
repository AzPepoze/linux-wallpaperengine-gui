import { BrowserWindow } from "electron";
import { IPC_LOG_CHANNEL } from "../shared/constants";
import { cleanLog, addTimestamp } from "../shared/logger";

let mainWindow: BrowserWindow | null = null;

// IPC channels to hide from logs
const HIDDEN_IPC = new Set<string>([
	"fs-exists",
]);

export function setMainWindow(win: BrowserWindow | null) {
	mainWindow = win;
}

function writeToConsole(type: string, message: string) {
	console.log(addTimestamp(`[${type.toUpperCase()}] ${message}`));
}

/**
 * Dispatches a log message to both the terminal and the UI.
 * Handles loop prevention for logs originating from external processes (Go backend).
 */
function dispatchLog(
	options: {
		type: string;
		showInTerminal: boolean;
		isExternal?: boolean;
	},
	...data: any[]
) {
	const message = cleanLog(...data);

	// Output to terminal if requested and not already coming from an external source (to avoid loops)
	if (options.showInTerminal && !options.isExternal) {
		writeToConsole(options.type, message);
	}

	// Always send to UI for the Logs Popup if window is available
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send(IPC_LOG_CHANNEL, {
			type: options.type,
			message,
		});
	}
}

export const logger = {
	/** Logs from the Svelte UI */
	frontend: (...args: any[]) => {
		dispatchLog({ type: "frontend", showInTerminal: true }, ...args);
	},

	/** Logs from the Electron main process about backend orchestration */
	backend: (...args: any[]) => {
		dispatchLog({ type: "electron", showInTerminal: true }, ...args);
	},

	/** Logs about wallpaper management */
	wallpaper: (...args: any[]) => {
		dispatchLog({ type: "wallpaper", showInTerminal: false }, ...args);
	},

	warn: (...args: any[]) => {
		dispatchLog({ type: "electron", showInTerminal: true }, "Warning:", ...args);
	},

	error: (...args: any[]) => {
		dispatchLog({ type: "error", showInTerminal: true }, "Error:", ...args);
	},

	/** Entry point for logs received from the Go backend socket */
	socketLog: (type: string, message: string) => {
		dispatchLog(
			{
				type: type || "backend",
				showInTerminal: true,
				isExternal: true
			},
			message
		);
	},

	/** Logs about IPC communication */
	ipcReceived: (channel: string, ...args: any[]) => {
		if (HIDDEN_IPC.has(channel)) return;
		dispatchLog({ type: "electron", showInTerminal: true }, `Received: ${channel}`, ...args);
	},
};
