package config

type ScreenConfig struct {
	Name             string  `json:"name"`
	Wallpaper        *string `json:"wallpaper"`
	Playlist         string  `json:"playlist"`
	PlaylistInterval float64 `json:"playlistInterval,omitempty"`
}

type AppConfig struct {
	// --- Linux Wallpaper Engine Arguments ---
	// Performance & Basic Behavior
	FPS               int  `json:"FPS,omitempty"`
	Silence           bool `json:"SILENCE,omitempty"`
	NoAutomute        bool `json:"noAutomute,omitempty"`
	NoAudioProcessing bool `json:"noAudioProcessing,omitempty"`
	NoFullscreenPause bool `json:"noFullscreenPause,omitempty"`
	DisableParticles  bool `json:"disableParticles,omitempty"`
	DumpStructure     bool `json:"dumpStructure,omitempty"`

	// Display & Rendering
	Scaling          string  `json:"scaling,omitempty"`
	Clamping         string  `json:"clamping,omitempty"`
	Playlist         string  `json:"playlist"`
	PlaylistInterval float64 `json:"playlistInterval,omitempty"`

	// Audio Settings
	Volume *float64 `json:"volume,omitempty"`

	// Input & Interaction
	DisableMouse    bool `json:"disableMouse,omitempty"`
	DisableParallax bool `json:"disableParallax,omitempty"`

	// Fullscreen Pause Logic
	FullscreenPauseOnlyActive   bool     `json:"fullscreenPauseOnlyActive,omitempty"`
	FullscreenPauseIgnoreAppIds []string `json:"fullscreenPauseIgnoreAppIds,omitempty"`

	// Wallpaper Properties
	Properties          map[string]string            `json:"properties,omitempty"`
	WallpaperProperties map[string]map[string]string `json:"wallpaperProperties,omitempty"`

	// Custom Arguments
	CustomArgs        string `json:"customArgs,omitempty"`
	CustomArgsEnabled bool   `json:"customArgsEnabled,omitempty"`

	// Utilities & Paths
	Screenshot      string `json:"screenshot,omitempty"`
	ScreenshotDelay int    `json:"screenshotDelay,omitempty"`
	AssetsDir       string `json:"assetsDir,omitempty"`

	// --- GUI / Internal Settings ---
	Screens                  []ScreenConfig `json:"screens,omitempty"`
	CloneMode                bool           `json:"cloneMode,omitempty"`
	GlobalWallpaper          *string        `json:"globalWallpaper,omitempty"`
	CustomExecutableLocation string         `json:"customExecutableLocation,omitempty"`
	WallpaperEngineDir       string         `json:"wallpaperEngineDir,omitempty"`
	SteamApiKey              string         `json:"steamApiKey,omitempty"`
	NativeWayland            bool           `json:"nativeWayland,omitempty"`
}
