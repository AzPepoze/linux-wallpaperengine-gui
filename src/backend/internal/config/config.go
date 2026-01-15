package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

var (
	HomePath        string
	ConfigPath      string
	WallpaperPath   string
	DefaultConfig   AppConfig
)

func init() {
	var err error
	HomePath, err = os.UserHomeDir()
	if err != nil {
		HomePath = os.Getenv("HOME")
	}

	ConfigPath = filepath.Join(HomePath, ".config/linux-wallpaperengine-gui/config.json")

	DefaultConfig = AppConfig{
		FPS:               60,
		Silence:           false,
		CustomArgs:        "",
		CustomArgsEnabled: false,
		Volume:            newFloat(100),
		NoAutomute:        false,
		NoAudioProcessing: false,
		Scaling:           "default",
		Clamping:          "clamp",
		ScreenshotDelay:   5,
		Properties:        make(map[string]string),
		WallpaperProperties: make(map[string]map[string]string),
		Playlist:          []string{},
	}
}

func newFloat(f float64) *float64 {
	return &f
}

func EnsureInitialized() error {
	if WallpaperPath != "" {
		return nil
	}

	// Try to get from config first
	conf, err := ReadConfig()
	if err == nil && conf.WallpaperEngineDir != "" {
		WallpaperPath = conf.WallpaperEngineDir
		return nil
	}

	workshopSuffix := "steamapps/workshop/content/431960"
	steamPaths := []string{
		".local/share/Steam",
		".var/app/com.valvesoftware.Steam/.local/share/Steam",
		".steam/steam",
		".steam/root",
	}

	for _, p := range steamPaths {
		fullPath := filepath.Join(HomePath, p, workshopSuffix)
		if _, err := os.Stat(fullPath); err == nil {
			WallpaperPath = fullPath
			return nil
		}
	}

	WallpaperPath = filepath.Join(HomePath, ".local/share/Steam", workshopSuffix)
	return nil
}

func ReadConfig() (AppConfig, error) {
	data, err := os.ReadFile(ConfigPath)
	if err != nil {
		return DefaultConfig, err
	}

	var conf AppConfig
	if err := json.Unmarshal(data, &conf); err != nil {
		return DefaultConfig, err
	}

	// Merge with defaults if necessary (simple version)
	if conf.FPS == 0 {
		conf.FPS = 60
	}

	return conf, nil
}

func WriteConfig(conf AppConfig) error {
	dir := filepath.Dir(ConfigPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0755)
	}

	data, err := json.MarshalIndent(conf, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(ConfigPath, data, 0644)
}

func GetConfig() (AppConfig, error) {
	return ReadConfig()
}
