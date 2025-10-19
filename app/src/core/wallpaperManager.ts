import * as Neutralino from "@neutralinojs/lib";
import { killWallpaperEngineProcess } from "./wallpaperService";

//-------------------------------------------------------
// Type Definitions
//-------------------------------------------------------
let homePath: string;
let configPath: string;
let wallperBasePath: string;

export async function main() {
	homePath = await Neutralino.os.getEnv("HOME");
	configPath = `${homePath}/.config/linux-wallpaperengine-gui/config.json`;
	wallperBasePath = [homePath, ".local", "share", "Steam", "steamapps", "workshop", "content", "431960"].join("/");
}

interface ScreenConfig {
	name: string;
	wallpaper: string | null;
}

interface AppConfig {
	screens?: ScreenConfig[];
	FPS?: number;
	SILENCE?: boolean;
}

//-------------------------------------------------------
// Helper Functions
//-------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export async function mountWallapapersFolder() {
	await Neutralino.server.mount("wallpapers", wallperBasePath);
}

const readConfig = async (): Promise<AppConfig> => {
	try {
		const configContent = await Neutralino.filesystem.readFile(configPath);
		return JSON.parse(configContent);
	} catch (err: any) {
		if (err.code !== "NE_FS_FILRDER") {
			console.warn("Could not read config.json, returning default. Error:", err);
		}
		return {};
	}
};

const writeConfig = async (newConfig: AppConfig): Promise<void> => {
	await Neutralino.filesystem.writeFile(configPath, JSON.stringify(newConfig, null, 2));
};

export const manageWallpaper = async (): Promise<{ success: boolean; error?: string }> => {
	try {
		// Kill all existing instances
		await killWallpaperEngineProcess();

		const config = await readConfig();
		const screens = config.screens || [];
		const fps = config.FPS || 60;
		const isSilenced = config.SILENCE || false;

		// Spawn a new process for each screen
		for (const screen of screens) {
			if (!screen.wallpaper) continue;

			let args = `-r ${screen.name} -f ${fps}`;
			if (isSilenced) {
				args += " -s";
			}
			args += ` ${screen.wallpaper}`;

			await Neutralino.os.execCommand(`linux-wallpaperengine ${args}`, { background: true });
		}

		return { success: true };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(`Error in manageWallpaper: ${error}`);
		return { success: false, error };
	}
};

//-------------------------------------------------------
// Exported API Functions
//-------------------------------------------------------

export const getWallpapers = async () => {
	try {
		const homePath = await Neutralino.os.getEnv("HOME");
		const basePath = [homePath, ".local", "share", "Steam", "steamapps", "workshop", "content", "431960"].join(
			"/"
		);

		const entries = await Neutralino.filesystem.readDirectory(basePath);
		console.log(`Found ${entries.length} total entries.`);

		const directoryEntries = entries.filter((e) => e.type === "DIRECTORY");
		const wallpapers: Record<string, { previewPath: string | null; projectData: any }> = {};

		const batchSize = 50;
		for (let i = 0; i < directoryEntries.length; i += batchSize) {
			const batch = directoryEntries.slice(i, i + batchSize);

			const batchPromises = batch.map(
				async (folder): Promise<[string, { previewPath: string | null; projectData: any }]> => {
					const wallpaperPath = `${basePath}/${folder.entry}`;
					const projectJsonPath = `${wallpaperPath}/project.json`;
					let previewPath = null;
					let projectData: any = {};

					try {
						const projectJsonContent = await Neutralino.filesystem.readFile(projectJsonPath);
						projectData = JSON.parse(projectJsonContent);

						if (projectData.preview) {
							previewPath = `wallpapers/${folder.entry}/${projectData.preview}`;
						}
					} catch (readError) {
						console.warn(`Could not process project.json for ${folder.entry}:`, readError);
					}
					return [folder.entry, { previewPath, projectData }];
				}
			);

			const processedBatch = await Promise.all(batchPromises);
			Object.assign(wallpapers, Object.fromEntries(processedBatch));
		}

		return { success: true, wallpapers };
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		console.error("Failed to get wallpapers:", error);
		return { success: false, error };
	}
};

export type GetConfigResult = ({ success: true } & AppConfig) | { success: false; error: string };

export const getConfig = async (): Promise<GetConfigResult> => {
	try {
		const config = await readConfig();
		return { success: true, ...config };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
};

export const saveConfig = async (newConfig: Omit<AppConfig, "screens">) => {
	try {
		const currentConfig = await readConfig();
		const updatedConfig: AppConfig = {
			...currentConfig,
			...newConfig,
		};
		await writeConfig(updatedConfig);
		await manageWallpaper();
		return { success: true };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
};

export const setWallpaper = async (screenName: string, wallpaperFolderName: string | null) => {
	const config = await readConfig();
	const screens = config.screens || [];
	const screenIndex = screens.findIndex((s) => s.name === screenName);

	if (screenIndex > -1) {
		screens[screenIndex].wallpaper = wallpaperFolderName;
	} else {
		screens.push({ name: screenName, wallpaper: wallpaperFolderName });
	}

	await writeConfig({ ...config, screens });
	return await manageWallpaper();
};

export const openConfigInEditor = async () => {
	try {
		await Neutralino.os.open(configPath);
		return { success: true };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
};

export const getWallpaperPreview = async (path: string) => {
	try {
		const filePath = `${wallperBasePath}/${path.replace("wallpapers/", "")}`;
		const fileData = await Neutralino.filesystem.readBinaryFile(filePath);
		const base64Data = arrayBufferToBase64(fileData);

		const extension = path.split(".").pop()?.toLowerCase() || "jpeg";
		const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;

		return { success: true, data: `data:${mimeType};base64,${base64Data}` };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(`Error in getWallpaperPreview for path "${path}": ${error}`);
		return { success: false, error };
	}
};

export const getScreens = async (): Promise<{ success: boolean; screens?: string[]; error?: string }> => {
	try {
		const commandResult = await Neutralino.os.execCommand("xrandr --query");
		console.log("xrandr --query commandResult:", commandResult); // ADD THIS LOG

		// Check for command execution errors first
		if (commandResult.exitCode !== 0) {
			const error = commandResult.stdErr || `xrandr command failed with exit code ${commandResult.exitCode}`;
			console.error(`Error executing xrandr: ${error}`);
			return { success: false, error };
		}

		const stdout = commandResult.stdOut;
		if (!stdout) {
			return { success: false, error: "xrandr --query returned no output." };
		}

		const lines = stdout.split("\n");
		const screenNames: string[] = [];

		for (const line of lines) {
			if (line.includes(" connected")) {
				const screenName = line.split(" ")[0];
				screenNames.push(screenName);
			}
		}

		if (screenNames.length === 0) {
			return { success: false, error: "No connected screens found by xrandr." };
		}

		return { success: true, screens: screenNames };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(`Error in getScreens: ${error}`);
		return { success: false, error };
	}
};

export const clearAllWallpapers = async (): Promise<{ success: boolean; error?: string }> => {
	try {
		const currentConfig = await readConfig();
		const updatedConfig: AppConfig = { ...currentConfig, screens: [] };
		await writeConfig(updatedConfig);
		await manageWallpaper(); // Stop all running wallpapers
		return { success: true };
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(`Error in clearAllWallpapers: ${error}`);
		return { success: false, error };
	}
};
