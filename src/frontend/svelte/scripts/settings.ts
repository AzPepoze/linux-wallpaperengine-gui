import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { EXECUTABLE_NAME } from "../../shared/constants";

// Toast Management
export interface ToastMessage {
	message: string;
	type: "success" | "error" | "warn" | "info";
}

export const toastStore: Writable<ToastMessage | null> = writable(null);

export function showToast(
	message: string,
	type: "success" | "error" | "warn" | "info" = "success",
	duration = 3000,
) {
	toastStore.set({ message, type });
	setTimeout(() => {
		toastStore.set(null);
	}, duration);
}

export function clearToast() {
	toastStore.set(null);
}

// Helper function for error handling
function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

// Settings State Management
export interface SettingsState {
	[key: string]: any; // Index signature to allow dynamic access
	fps: number;
	silence: boolean;
	customArgs: string;
	customArgsEnabled: boolean;
	volume: number;
	noAutomute: boolean;
	noAudioProcessing: boolean;
	scaling: string;
	clamping: string;
	disableMouse: boolean;
	disableParallax: boolean;
	noFullscreenPause: boolean;
	disableParticles: boolean;
	binaryLocation: string;
	// New options
	fullscreenPauseOnlyActive: boolean;
	fullscreenPauseIgnoreAppIds: string[];
	screenshot: string;
	screenshotDelay: number;
	assetsDir: string;
	wallpaperEngineDir: string;
	properties: Record<string, string>;
	wallpaperProperties: Record<string, Record<string, string>>;
	dumpStructure: boolean;
	playlist: string;
	playlistInterval: number;
	nativeWayland: boolean;
	dynamicUiTheme: boolean;
	dynamicSidebarTheme: boolean;
	transparentUi: boolean;
	uiTransparency: number;
}

export const settingsStore: Writable<SettingsState | null> = writable(null);

const configFieldMap: Record<string, string> = {
	fps: "FPS",
	silence: "SILENCE",
	customArgs: "customArgs",
	customArgsEnabled: "customArgsEnabled",
	volume: "volume",
	noAutomute: "noAutomute",
	noAudioProcessing: "noAudioProcessing",
	scaling: "scaling",
	clamping: "clamping",
	disableMouse: "disableMouse",
	disableParallax: "disableParallax",
	noFullscreenPause: "noFullscreenPause",
	disableParticles: "disableParticles",
	binaryLocation: "customExecutableLocation",
	// New options mapping
	fullscreenPauseOnlyActive: "fullscreenPauseOnlyActive",
	fullscreenPauseIgnoreAppIds: "fullscreenPauseIgnoreAppIds",
	screenshot: "screenshot",
	screenshotDelay: "screenshotDelay",
	assetsDir: "assetsDir",
	wallpaperEngineDir: "wallpaperEngineDir",
	properties: "properties",
	wallpaperProperties: "wallpaperProperties",
	dumpStructure: "dumpStructure",
	playlist: "playlist",
	playlistInterval: "playlistInterval",
	nativeWayland: "nativeWayland",
	dynamicUiTheme: "dynamicUiTheme",
	dynamicSidebarTheme: "dynamicSidebarTheme",
	transparentUi: "transparentUi",
	uiTransparency: "uiTransparency",
};

// Settings Actions
export async function loadSettings(): Promise<void> {
	try {
		const config = await window.electronAPI.getConfig();
		if (config.success) {
			const settings: Partial<SettingsState> = {};

			// Map config values to settings
			for (const [key, configKey] of Object.entries(configFieldMap)) {
				const configValue = (config as any)[configKey];
				if (configValue !== undefined) {
					settings[key] = configValue;
				}
			}

			settingsStore.set(settings as SettingsState);
		} else {
			showToast(`Error loading config: ${config.error}`, "error");
		}
	} catch (e) {
		showToast(`Error loading config: ${getErrorMessage(e)}`, "error");
	}
}

export async function saveSettings(settings: SettingsState): Promise<void> {
	try {
		// Map settings to config object
		const configData: Record<string, any> = {};
		for (const [key, configKey] of Object.entries(configFieldMap)) {
			configData[configKey] = settings[key];
		}

		const result = await window.electronAPI.saveConfig(configData);
		if (result.success) {
			showToast("Settings saved successfully!", "success");
		} else {
			showToast(`Error saving settings: ${result.error}`, "error");
		}

		const applyResult = await window.electronAPI.applyWallpapers();
		if (!applyResult.success) {
			showToast(
				`Error applying wallpapers: ${applyResult.error}`,
				"error",
			);
		}
	} catch (e) {
		showToast(`Error saving settings: ${getErrorMessage(e)}`, "error");
	}
}

export async function openConfigFile(): Promise<void> {
	try {
		const result = await window.electronAPI.openConfigInEditor();
		if (result.success) {
			showToast("Config file opened!", "success");
		} else {
			showToast(
				`Failed to open config file: ${result.error}`,
				"error",
			);
		}
	} catch (e) {
		showToast(
			`Failed to open config file: ${getErrorMessage(e)}`,
			"error",
		);
	}
}

export async function validateBinaryFile(path: string): Promise<boolean> {
	if (!path) return true;

	const exists = await window.electronAPI.fsExists(path);
	if (!exists) {
		alert("The selected file does not exist or is not accessible.");
		return false;
	}

	const fileName = path.split("/").pop();
	if (fileName !== EXECUTABLE_NAME) {
		const confirmSelection = confirm(
			`The selected file "${fileName}" does not match the expected name "${EXECUTABLE_NAME}". Are you sure you want to use this file?`,
		);
		return confirmSelection;
	}

	return true;
}
