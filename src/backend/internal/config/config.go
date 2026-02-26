package config

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

var (
	HomePath      string
	ConfigPath    string
	WallpaperPath string
	AssetsPath    string
	DefaultConfig AppConfig
)

func init() {
	var err error
	HomePath, err = os.UserHomeDir()
	if err != nil {
		HomePath = os.Getenv("HOME")
	}

	ConfigPath = filepath.Join(HomePath, ".config/linux-wallpaperengine-gui/config.json")

	DefaultConfig = AppConfig{
		FPS:                 60,
		Silence:             false,
		CustomArgs:          "",
		CustomArgsEnabled:   false,
		Volume:              newFloat(100),
		NoAutomute:          false,
		NoAudioProcessing:   false,
		Scaling:             "default",
		Clamping:            "clamp",
		ScreenshotDelay:     5,
		Properties:          make(map[string]string),
		WallpaperProperties: make(map[string]map[string]string),
		Playlist:            "",
		DynamicUiTheme:      true,
		DynamicSidebarTheme: true,
		TransparentUi:       true,
		UiTransparency:      90,
		SteamPaths: []string{
			".local/share/Steam",
			".var/app/com.valvesoftware.Steam/.local/share/Steam",
			".steam/steam",
			".steam/root",
		},
	}
}

func newFloat(f float64) *float64 {
	return &f
}

func resolvePath(p string) string {
	if p == "" {
		return ""
	}
	if filepath.IsAbs(p) || strings.HasPrefix(p, "/") {
		return p
	}
	if strings.HasPrefix(p, "~/") {
		return filepath.Join(HomePath, p[2:])
	}
	return filepath.Join(HomePath, p)
}

func EnsureInitialized() error {
	// Clear previous paths to allow fresh detection
	WallpaperPath = ""
	AssetsPath = ""

	// Try to get from config first
	conf, err := ReadConfig()
	if err != nil {
		return err
	}

	workshopSuffix := "steamapps/workshop/content/431960"
	assetsSuffix := "steamapps/common/wallpaper_engine"
	steamPaths := conf.SteamPaths
	if len(steamPaths) == 0 {
		steamPaths = DefaultConfig.SteamPaths
	}

	// 1. Resolve Assets Path (Wallpaper Engine Dir)
	if conf.AssetsDir != "" {
		AssetsPath = resolvePath(conf.AssetsDir)
	}

	if AssetsPath == "" {
		// Auto-detect from steam paths
		for _, p := range steamPaths {
			steamRoot := resolvePath(p)
			fullPath := filepath.Join(steamRoot, assetsSuffix)
			if _, err := os.Stat(fullPath); err == nil {
				AssetsPath = fullPath
				break
			}
		}
	}

	// 2. Resolve Workshop Path
	if conf.WallpaperEngineDir != "" {
		WallpaperPath = resolvePath(conf.WallpaperEngineDir)
	}

	// Try to derive workshop from assets if still missing
	if WallpaperPath == "" && AssetsPath != "" {
		derived := filepath.Join(AssetsPath, "../../workshop/content/431960")
		if _, err := os.Stat(derived); err == nil {
			WallpaperPath = derived
		}
	}

	if WallpaperPath == "" {
		// Auto-detect from steam paths
		for _, p := range steamPaths {
			steamRoot := resolvePath(p)
			fullPath := filepath.Join(steamRoot, workshopSuffix)
			if _, err := os.Stat(fullPath); err == nil {
				WallpaperPath = fullPath
				break
			}
		}
	}

	return nil
}

func ReadConfig() (AppConfig, error) {
	data, err := os.ReadFile(ConfigPath)
	if err != nil {
		if os.IsNotExist(err) {
			if werr := WriteConfig(DefaultConfig); werr != nil {
				return DefaultConfig, werr
			}
			return DefaultConfig, nil
		}
		return DefaultConfig, err
	}

	conf := DefaultConfig
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
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
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

func OpenConfigEditor() error {
	cmd := exec.Command("xdg-open", ConfigPath)
	return cmd.Start()
}
