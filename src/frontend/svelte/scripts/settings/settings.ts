import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { EXECUTABLE_NAME } from "@shared/constants";
import { logger } from "@/scripts/shared/logger";

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
	[key: string]: any; 
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
	fullscreenPauseOnlyActive: boolean;
	fullscreenPauseIgnoreAppIds: string[];
	screenshot: string;
	screenshotDelay: number;
	wallpaperEngineDir: string;
	workshopDir: string;
	properties: Record<string, string>;
	wallpaperProperties: Record<string, Record<string, string>>;
	dumpStructure: boolean;
	playlist: string;
	playlistInterval: number;
	nativeWayland: boolean;
	autostart: boolean;
	dynamicUiTheme: boolean;
	dynamicSidebarTheme: boolean;
	transparentUi: boolean;
	uiTransparency: number;
	steamPaths: string[];
	enableScrollMask: boolean;
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
	fullscreenPauseOnlyActive: "fullscreenPauseOnlyActive",
	fullscreenPauseIgnoreAppIds: "fullscreenPauseIgnoreAppIds",
	screenshot: "screenshot",
	screenshotDelay: "screenshotDelay",
	wallpaperEngineDir: "wallpaperEngineDir",
	workshopDir: "workshopDir",
	properties: "properties",
	wallpaperProperties: "wallpaperProperties",
	dumpStructure: "dumpStructure",
	playlist: "playlist",
	playlistInterval: "playlistInterval",
	nativeWayland: "nativeWayland",
	autostart: "autostart",
	dynamicUiTheme: "dynamicUiTheme",
	dynamicSidebarTheme: "dynamicSidebarTheme",
	transparentUi: "transparentUi",
	uiTransparency: "uiTransparency",
	steamPaths: "steamPaths",
	enableScrollMask: "enableScrollMask",
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

			// Ensure playlist defaults
			if (settings.playlist === undefined) settings.playlist = '';
			if (settings.playlistInterval === undefined) settings.playlistInterval = 0;

			settingsStore.set(settings as SettingsState);
		} else {
			showToast(`Error loading config: ${config.error}`, "error");
		}
	} catch (e) {
		showToast(`Error loading config: ${getErrorMessage(e)}`, "error");
	}
}

export async function saveSettings(
	settings: SettingsState,
	silent: boolean = false
): Promise<void> {
	try {
		// Map settings to config object
		const configData: Record<string, any> = {};
		for (const [key, configKey] of Object.entries(configFieldMap)) {
			configData[configKey] = settings[key];
		}

		const result = await window.electronAPI.saveConfig(configData);
		if (result.success) {
			if (!silent) {
				showToast("Settings saved successfully!", "success");
			}
		} else {
			showToast(`Error saving settings: ${result.error}`, "error");
		}

		const applyResult = await window.electronAPI.applyWallpapers();
		if (!applyResult.success) {
			showToast(
				`Error applying wallpapers: ${applyResult.error}`,
				"error"
			);
		}
	} catch (e) {
		showToast(`Error saving settings: ${getErrorMessage(e)}`, "error");
	}
}

export async function handleAutostart(enable: boolean): Promise<void> {
	try {
		const result = await window.electronAPI.toggleAutostart(enable);
		if (result.success) {
			showToast("Autostart toggled successfully!", "success");
		} else {
			showToast(`Error toggling autostart: ${result.error}`, "error");
		}
	} catch (e) {
		showToast(`Error toggling autostart: ${getErrorMessage(e)}`, "error")
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

// Path Detection
export interface DetectedPaths {
	wallpaperPath: string;
	assetsPath: string;
	workshopValid: boolean;
	assetsValid: boolean;
}

export const detectedPathsStore = writable<DetectedPaths>({
	wallpaperPath: '',
	assetsPath: '',
	workshopValid: false,
	assetsValid: false
});

export async function updateDetectedPaths() {
	const wallpaperPath = await window.electronAPI.getWallpaperBasePath();
	const assetsPath = await window.electronAPI.getAssetsBasePath();

	detectedPathsStore.set({
		wallpaperPath: wallpaperPath || '',
		assetsPath: assetsPath || '',
		workshopValid: !!wallpaperPath && wallpaperPath !== '',
		assetsValid: !!assetsPath && assetsPath !== ''
	});
}

export async function openWallpaperFolder() {
	try {
		const path = await window.electronAPI.getWallpaperBasePath();
		if (path) {
			const error = await window.electronAPI.openPath(path);
			if (error) {
				logger.error('Failed to open folder:', error);
				showToast(`Failed to open folder: ${error}`, 'error');
			}
		} else {
			showToast('No workshop folder path found. Check your search paths.', 'warn');
		}
	} catch (e) {
		logger.error('Error opening folder:', e);
	}
}

export async function openAssetsFolder() {
	try {
		const path = await window.electronAPI.getAssetsBasePath();
		if (path) {
			const error = await window.electronAPI.openPath(path);
			if (error) {
				logger.error('Failed to open assets folder:', error);
				showToast(`Failed to open assets folder: ${error}`, 'error');
			}
		} else {
			showToast('No assets folder path found. Check your search paths.', 'warn');
		}
	} catch (e) {
		logger.error('Error opening folder:', e);
	}
}
