/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ElectronAPI {
	// Event handling
	on: (channel: string, callback: (data: any) => void) => void;
	sendLog: (type: string, ...args: any[]) => void;

	// Window controls
	exit: () => Promise<void>;
	minimize: () => Promise<void>;
	maximize: () => Promise<void>;
	hide: () => Promise<void>;
	restartUI: () => Promise<void>;

	// Screen management
	getScreens: () => Promise<{ success: boolean; screens?: string[]; error?: string }>;

	// System operations
	execCommand: (command: string, args?: string[], show_log?: boolean) => Promise<any>;
	getEnv: (key: string) => Promise<string | undefined>;
	getHomeDir: () => Promise<string>;
	openExternal: (url: string) => Promise<void>;

	// File system operations
	readDirectory: (path: string) => Promise<{ entry: string; type: "DIRECTORY" | "FILE" }[]>;
	readFile: (path: string) => Promise<string>;
	writeFile: (path: string, content: string) => Promise<void>;
	readBinaryFile: (path: string) => Promise<ArrayBuffer>;
	fsExists: (path: string) => Promise<boolean>;
	selectDir: () => Promise<string>;
	selectFile: () => Promise<string>;
	getDirectorySize: (path: string) => Promise<number>;

	// Configuration management
	getConfig: () => Promise<any>;
	readConfig: () => Promise<any>;
	saveConfig: (newConfig: any) => Promise<{ success: boolean; error?: string }>;
	writeConfig: (newConfig: any) => Promise<void>;
	openConfigInEditor: () => Promise<{ success: boolean; error?: string }>;
	getWallpaperExecutableLocation: () => Promise<string>;
	getWallpaperBasePath: () => Promise<string>;
	validateExecutable: () => Promise<boolean>;

	// Wallpaper management
	applyWallpapers: () => Promise<{ success: boolean; error?: string }>;
	setWallpaper: (screenName: string, wallpaperFolderName: string | null) => Promise<{ success: boolean; error?: string }>;
	toggleCloneMode: (enabled: boolean, globalWallpaper?: string | null) => Promise<{ success: boolean; error?: string }>;
	clearAllWallpapers: () => Promise<{ success: boolean; error?: string }>;
	loadWallpapers: () => Promise<{ wallpapers: Record<string, any>; error: string | null; selectedWallpaper: any | null }>;
	getWallpaperPreview: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
	getWallpaperProjectData: (id: string) => Promise<{ success: boolean; properties?: Record<string, any>; error?: string }>;
	getWallpaperProperties: (id: string) => Promise<any[]>;
	saveWallpaperProperty: (id: string, key: string, value: string) => Promise<{ success: boolean; error?: string }>;

	// Playlist management
	getPlaylists: () => Promise<{ success: boolean; playlists: any[]; error?: string }>;
	startPlaylist: (playlistName: string, intervalMinutes: number, screenName?: string) => Promise<any>;
	stopPlaylist: (screenName?: string) => Promise<any>;
	updatePlaylistInterval: (playlistName: string, intervalMinutes: number, screenName?: string) => Promise<any>;
	createPlaylist: (name: string) => Promise<any>;
	renamePlaylist: (oldName: string, newName: string) => Promise<any>;
	deletePlaylist: (name: string) => Promise<any>;
	updatePlaylistWallpapers: (name: string, items: string[]) => Promise<any>;

	// Workshop
	getPublishedFileDetails: (fileIds: string[]) => Promise<any[]>;
	queryWorkshopFiles: (options: {
		query_type?: number;
		page?: number;
		cursor?: string;
		numperpage?: number;
		requiredtags?: string[];
		excludedtags?: string[];
		match_all_tags?: boolean;
		search_text?: string;
		item_type?: number;
	}) => Promise<{ items: any[]; total: number; nextCursor?: string; error?: string }>;
	getUGCFileDetails: (ugcId: string, steamId?: string) => Promise<any | null>;
	fetchImage: (url: string) => Promise<string>;
	subscribeWorkshopItem: (fileId: string) => Promise<{ success: boolean }>;
	unsubscribeWorkshopItem: (fileId: string) => Promise<{ success: boolean }>;
	getWorkshopItemDownloadInfo: (
		fileId: string,
	) => Promise<{ current: string; total: string } | null>;
	getWorkshopItemInstallInfo: (
		fileId: string,
	) => Promise<{ folder: string; sizeOnDisk: string; timestamp: number } | null>;

	// Steam Filters
	getInstalledFilters: () => Promise<{ success: boolean; filters: FilterConfig; error?: string }>;
	saveInstalledFilters: (filters: FilterConfig) => Promise<{ success: boolean; error?: string }>;
	getWorkshopFilters: () => Promise<{ success: boolean; filters: FilterConfig; error?: string }>;
	saveWorkshopFilters: (filters: FilterConfig) => Promise<{ success: boolean; error?: string }>;
	isSteamRunning: () => Promise<boolean>;
	getAllDownloadingItems: () => Promise<any[]>;
	killWallpaper: (params: { folderName: string }) => Promise<{ success: boolean }>;
	getSubscribedItems: () => Promise<string[]>;
}

interface Window {
	electronAPI: ElectronAPI;
}
