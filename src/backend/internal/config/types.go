package config

type ScreenConfig struct {
	Name      string  `json:"name"`
	Wallpaper *string `json:"wallpaper"`
}

type AppConfig struct {
	Screens                     []ScreenConfig            `json:"screens,omitempty"`
	FPS                         int                       `json:"FPS,omitempty"`
	Silence                     bool                      `json:"SILENCE,omitempty"`
	CustomArgs                  string                    `json:"customArgs,omitempty"`
	CustomArgsEnabled           bool                      `json:"customArgsEnabled,omitempty"`
	Volume                      *float64                  `json:"volume,omitempty"`
	NoAutomute                  bool                      `json:"noAutomute,omitempty"`
	NoAudioProcessing           bool                      `json:"noAudioProcessing,omitempty"`
	Scaling                     string                    `json:"scaling,omitempty"`
	Clamping                    string                    `json:"clamping,omitempty"`
	DisableMouse                bool                      `json:"disableMouse,omitempty"`
	DisableParallax             bool                      `json:"disableParallax,omitempty"`
	DisableParticles            bool                      `json:"disableParticles,omitempty"`
	NoFullscreenPause           bool                      `json:"noFullscreenPause,omitempty"`
	CustomExecutableLocation    string                    `json:"customExecutableLocation,omitempty"`
	CloneMode                   bool                      `json:"cloneMode,omitempty"`
	GlobalWallpaper             *string                   `json:"globalWallpaper,omitempty"`
	FullscreenPauseOnlyActive   bool                      `json:"fullscreenPauseOnlyActive,omitempty"`
	FullscreenPauseIgnoreAppIds []string                  `json:"fullscreenPauseIgnoreAppIds,omitempty"`
	Screenshot                  string                    `json:"screenshot,omitempty"`
	ScreenshotDelay             int                       `json:"screenshotDelay,omitempty"`
	AssetsDir                   string                    `json:"assetsDir,omitempty"`
	WallpaperEngineDir          string                    `json:"wallpaperEngineDir,omitempty"`
	Properties                  map[string]string         `json:"properties,omitempty"`
	WallpaperProperties         map[string]map[string]string `json:"wallpaperProperties,omitempty"`
	DumpStructure               bool                      `json:"dumpStructure,omitempty"`
	Playlist                    []string                  `json:"playlist,omitempty"`
}
