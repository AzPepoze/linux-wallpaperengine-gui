type Resolve = (value: unknown) => void;
type Reject = (reason: Error) => void;

type PendingRequest = { resolve: Resolve; reject: Reject };

interface NativeRuntimeBridge {
	invoke(method: string, paramsJson: string, requestId: number): void;
	resolved: { connect(callback: (requestId: number, resultJson: string) => void): void };
	rejected: { connect(callback: (requestId: number, message: string) => void): void };
	eventReceived: { connect(callback: (method: string, paramsJson: string) => void): void };
}

class QtTransport {
	private bridge: NativeRuntimeBridge;
	private nextId = 1;
	private pending = new Map<number, PendingRequest>();
	private listeners = new Map<string, Set<(data: any) => void>>();

	constructor(bridge: NativeRuntimeBridge) {
		this.bridge = bridge;
		bridge.resolved.connect((requestId, resultJson) => {
			const pending = this.pending.get(requestId);
			if (!pending) return;
			this.pending.delete(requestId);
			try {
				pending.resolve(JSON.parse(resultJson));
			} catch {
				pending.resolve(null);
			}
		});
		bridge.rejected.connect((requestId, message) => {
			const pending = this.pending.get(requestId);
			if (!pending) return;
			this.pending.delete(requestId);
			pending.reject(new Error(message));
		});
		bridge.eventReceived.connect((method, paramsJson) => {
			let data: any = null;
			try {
				data = JSON.parse(paramsJson);
			} catch {
				data = null;
			}
			for (const listener of this.listeners.get(method) ?? []) listener(data);
		});
	}

	invoke(method: string, params: unknown = {}): Promise<any> {
		const requestId = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pending.set(requestId, { resolve, reject });
			this.bridge.invoke(method, JSON.stringify(params ?? {}), requestId);
		});
	}

	on(method: string, callback: (data: any) => void) {
		let listeners = this.listeners.get(method);
		if (!listeners) {
			listeners = new Set();
			this.listeners.set(method, listeners);
		}
		listeners.add(callback);
	}
}

function loadWebChannelScript(): Promise<void> {
	if ((window as any).QWebChannel) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "qrc:///qtwebchannel/qwebchannel.js";
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Qt WebChannel runtime"));
		document.head.appendChild(script);
	});
}

async function createTransport(): Promise<QtTransport> {
	const qt = (window as any).qt;
	if (!qt?.webChannelTransport) {
		throw new Error("Qt WebEngine runtime bridge is unavailable");
	}
	await loadWebChannelScript();

	return await new Promise<QtTransport>((resolve) => {
		const QWebChannel = (window as any).QWebChannel;
		new QWebChannel(qt.webChannelTransport, (channel: any) => {
			resolve(new QtTransport(channel.objects.runtimeBridge as NativeRuntimeBridge));
		});
	});
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
	if (!value) return new ArrayBuffer(0);
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

async function updateConfig(transport: QtTransport, updates: Record<string, unknown>) {
	const current = await transport.invoke("get-config");
	const merged = { ...current, ...updates };
	await transport.invoke("write-config", merged);
	return merged;
}

function createRuntimeAPI(transport: QtTransport): ElectronAPI {
	const safe = async <T>(action: () => Promise<T>, fallback: T): Promise<T> => {
		try {
			return await action();
		} catch (error) {
			console.error(error);
			return fallback;
		}
	};

	return {
		on: (channel, callback) => transport.on(channel, callback),
		sendLog: (type, ...args) => {
			void transport.invoke("send-log", [type, ...args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg))]);
		},

		exit: () => transport.invoke("app-exit", []),
		minimize: () => transport.invoke("window-minimize", []),
		maximize: () => transport.invoke("window-maximize", []),
		hide: () => transport.invoke("window-hide", []),
		restartUI: () => transport.invoke("restart-ui", []),

		getScreens: () => transport.invoke("get-screens"),
		execCommand: (command, args = [], show_log = false) => transport.invoke("exec-command", { command, args, show_log }),
		getEnv: (key) => transport.invoke("get-env", [key]),
		getHomeDir: () => transport.invoke("get-home-dir", []),
		getVersion: () => transport.invoke("get-version", []),
		getAppIcon: async () => base64ToArrayBuffer(await transport.invoke("get-app-icon", [])),
		selectDir: () => transport.invoke("select-dir", []),
		selectFile: () => transport.invoke("select-file", []),
		openExternal: (url) => transport.invoke("open-external", [url]),
		openPath: (path) => transport.invoke("open-path", [path]),

		readDirectory: (path) => transport.invoke("fs-read-dir", [path]),
		readFile: (path) => transport.invoke("fs-read-file", [path]),
		writeFile: (path, content) => transport.invoke("fs-write-file", [path, content]),
		readBinaryFile: async (path) => base64ToArrayBuffer(await transport.invoke("fs-read-binary", [path])),
		fsExists: (path) => transport.invoke("fs-exists", [path]),
		getDirectorySize: (path) => transport.invoke("get-directory-size", [path]),

		getConfig: async () => {
			try {
				const config = await transport.invoke("get-config");
				return { success: true, ...config };
			} catch (error: any) {
				return { success: false, error: error?.message ?? String(error) };
			}
		},
		readConfig: () => transport.invoke("get-config"),
		saveConfig: async (newConfig) => {
			try {
				await updateConfig(transport, newConfig);
				return { success: true };
			} catch (error: any) {
				return { success: false, error: error?.message ?? String(error) };
			}
		},
		writeConfig: (newConfig) => transport.invoke("write-config", newConfig),
		toggleAutostart: (enable) => transport.invoke("toggle-autostart", enable),
		openConfigInEditor: () => transport.invoke("open-config-editor"),
		getWallpaperExecutableLocation: async () => {
			const config = await transport.invoke("get-config");
			return config.customExecutableLocation || "linux-wallpaperengine";
		},
		getWallpaperBasePath: () => transport.invoke("get-wallpaper-base-path"),
		getAssetsBasePath: () => transport.invoke("get-assets-base-path"),
		validateExecutable: () => transport.invoke("validate-executable", []),

		applyWallpapers: () => transport.invoke("apply-wallpapers"),
		setWallpaper: async (screenName, wallpaperFolderName) => {
			const config = await transport.invoke("get-config");
			const screens = [...(config.screens ?? [])];
			const index = screens.findIndex((screen: any) => screen.name === screenName);
			if (index >= 0) screens[index] = { ...screens[index], wallpaper: wallpaperFolderName };
			else screens.push({ name: screenName, wallpaper: wallpaperFolderName, playlist: "" });
			const updates: Record<string, unknown> = { screens };
			if (config.cloneMode || config.spanMode) updates.globalWallpaper = wallpaperFolderName;
			await updateConfig(transport, updates);
			return transport.invoke("apply-wallpapers");
		},
		toggleCloneMode: async (enabled, globalWallpaper) => {
			const updates: Record<string, unknown> = { cloneMode: enabled };
			if (enabled) updates.spanMode = false;
			if (globalWallpaper !== undefined) updates.globalWallpaper = globalWallpaper;
			await updateConfig(transport, updates);
			return transport.invoke("apply-wallpapers");
		},
		toggleSpanMode: async (enabled, globalWallpaper) => {
			const updates: Record<string, unknown> = { spanMode: enabled };
			if (enabled) updates.cloneMode = false;
			if (globalWallpaper !== undefined) updates.globalWallpaper = globalWallpaper;
			await updateConfig(transport, updates);
			return transport.invoke("apply-wallpapers");
		},
		clearAllWallpapers: async () => {
			await updateConfig(transport, { screens: [] });
			return transport.invoke("apply-wallpapers");
		},
		loadWallpapers: () => transport.invoke("load-wallpapers"),
		killWallpaper: (params) => transport.invoke("kill-wallpaper", params),
		getWallpaperPreview: (path) => transport.invoke("get-wallpaper-preview", [path]),
		getWallpaperProjectData: (id) => transport.invoke("get-wallpaper-project-data", { id }),
		getWallpaperProperties: (id) => transport.invoke("get-wallpaper-properties", [id]),
		saveWallpaperProperty: async (id, key, value) => {
			const config = await transport.invoke("get-config");
			const wallpaperProperties = { ...(config.wallpaperProperties ?? {}) };
			wallpaperProperties[id] = { ...(wallpaperProperties[id] ?? {}), [key]: value };
			await updateConfig(transport, { wallpaperProperties });
			return transport.invoke("apply-wallpapers");
		},
		startPreview: (wallpaperId, geometry) => transport.invoke("start-preview", { wallpaperId, geometry: geometry || "0x0x1280x720" }),
		stopPreview: () => transport.invoke("stop-preview"),
		isPreviewRunning: () => transport.invoke("is-preview-running"),

		getPlaylists: () => transport.invoke("get-playlists"),
		startPlaylist: (playlistName, intervalMinutes, screenName) => transport.invoke("start-playlist", { playlistName, intervalMinutes, screenName }),
		stopPlaylist: (screenName) => transport.invoke("stop-playlist", { screenName }),
		updatePlaylistInterval: (playlistName, intervalMinutes, screenName) => transport.invoke("update-playlist-interval", { playlistName, intervalMinutes, screenName }),
		createPlaylist: (name) => transport.invoke("create-playlist", { name }),
		renamePlaylist: (oldName, newName) => transport.invoke("rename-playlist", { oldName, newName }),
		deletePlaylist: (name) => transport.invoke("delete-playlist", { name }),
		updatePlaylistWallpapers: (name, items) => transport.invoke("update-playlist-wallpapers", { name, items }),

		getPublishedFileDetails: (fileIds) => transport.invoke("get-published-file-details", { fileIds }),
		queryWorkshopFiles: (options) => transport.invoke("query-workshop-files", options),
		getUGCFileDetails: (ugcId) => transport.invoke("get-ugc-file-details", { ugcId }),
		fetchImage: (url) => transport.invoke("fetch-image", [url]),
		subscribeWorkshopItem: (fileId) => transport.invoke("subscribe-workshop-item", { fileId }),
		unsubscribeWorkshopItem: async (fileId) => {
			await safe(() => transport.invoke("kill-wallpaper", { folderName: fileId }), { success: false });
			return transport.invoke("unsubscribe-workshop-item", { fileId });
		},
		getWorkshopItemDownloadInfo: (fileId) => transport.invoke("get-workshop-item-download-info", { fileId }),
		getWorkshopItemInstallInfo: (fileId) => transport.invoke("get-workshop-item-install-info", { fileId }),
		isSteamRunning: () => safe(() => transport.invoke("is-steam-running"), false),
		getAllDownloadingItems: () => safe(() => transport.invoke("get-all-downloading-items"), []),
		getSubscribedItems: () => safe(() => transport.invoke("get-subscribed-items"), []),

		getInstalledFilters: () => transport.invoke("get-installed-filters"),
		saveInstalledFilters: (filters) => transport.invoke("save-installed-filters", filters),
		getWorkshopFilters: () => transport.invoke("get-workshop-filters"),
		saveWorkshopFilters: (filters) => transport.invoke("save-workshop-filters", filters),
	};
}

export async function initializeRuntimeBridge(): Promise<void> {
	const transport = await createTransport();
	const api = createRuntimeAPI(transport);
	window.runtimeAPI = api;
	// Compatibility while the Svelte code is migrated away from the old name.
	window.electronAPI = api;
}
