package config

import (
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
)

var (
	HomePath            string
	ConfigPath          string
	AutostartPath       string
	WorkshopPath        string
	WallpaperEnginePath string
	DefaultConfig       AppConfig

	corruptConfigPrompt struct {
		sync.Mutex
		displayed bool
	}
)

func init() {
	var err error
	HomePath, err = os.UserHomeDir()
	if err != nil {
		HomePath = os.Getenv("HOME")
	}

	ConfigPath = filepath.Join(HomePath, ".config/linux-wallpaperengine-gui/config.json")
	AutostartPath = filepath.Join(HomePath, ".config/autostart/linux-wallpaperengine-gui.desktop")

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
		Layer:               "bottom",
		ScreenshotDelay:     5,
		Properties:          make(map[string]string),
		WallpaperProperties: make(map[string]map[string]string),
		Playlist:            "",
		Autostart:           false,
		DynamicUiTheme:      true,
		DynamicSidebarTheme: true,
		TransparentUi:       true,
		UiTransparency:      90,
		EnableScrollMask:    true,
		HookEnabled:              false,
		HideTrayLabel:            false,
		WallpaperChangeCommand:   "",
		SteamPaths: []string{
			".local/share/Steam",
			".var/app/com.valvesoftware.Steam/.local/share/Steam",
			".steam/steam",
			".steam/root",
		},
		InstalledFilters: &FilterConfig{
			CategoryTags:   make(map[string]bool),
			RatingTags:     map[string]bool{"Everyone": true},
			ResolutionTags: make(map[string]bool),
			SourceTags:     make(map[string]bool),
			Tags:           make(map[string]bool),
			TypeTags:       make(map[string]bool),
			UtilityTags:    make(map[string]bool),
			Sort:           "priority",
			Descending:     true,
		},
		WorkshopFilters: &FilterConfig{
			CategoryTags:   make(map[string]bool),
			RatingTags:     map[string]bool{"Everyone": true, "Questionable": false, "Mature": false},
			ResolutionTags: make(map[string]bool),
			SourceTags:     make(map[string]bool),
			Tags:           make(map[string]bool),
			TypeTags:       make(map[string]bool),
			UtilityTags:    make(map[string]bool),
			Sort:           "priority",
			Descending:     true,
		},
	}
}

type corruptConfigAction int

const (
	cancelCorruptConfigAction corruptConfigAction = iota
	resetCorruptConfigAction
	openCorruptConfigInEditorAction
)

func showCorruptConfigPrompt() corruptConfigAction {
	const editorButton = "Open in editor"
	const message = "Config file is corrupted. Reset it to defaults or open it in an editor to fix it manually?"

	// Try zenity first (common on GNOME/GTK environments). Its extra button
	// writes its label to stdout, while the primary button writes nothing.
	if _, err := exec.LookPath("zenity"); err == nil {
		output, err := exec.Command(
			"zenity",
			"--question",
			"--title=Config Error",
			"--text="+message,
			"--ok-label=Reset to defaults",
			"--cancel-label=Cancel",
			"--extra-button="+editorButton,
		).Output()
		if err != nil {
			return cancelCorruptConfigAction
		}
		if strings.TrimSpace(string(output)) == editorButton {
			return openCorruptConfigInEditorAction
		}
		return resetCorruptConfigAction
	}

	// Fall back to kdialog on KDE. "No" is repurposed as the editor option.
	if _, err := exec.LookPath("kdialog"); err == nil {
		cmd := exec.Command(
			"kdialog",
			"--title", "Config Error",
			"--yesnocancel", message,
			"--yes-label", "Reset to defaults",
			"--no-label", editorButton,
			"--cancel-label", "Cancel",
		)
		if err := cmd.Run(); err == nil {
			return resetCorruptConfigAction
		} else {
			var exitErr *exec.ExitError
			if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
				return openCorruptConfigInEditorAction
			}
		}
	}

	return cancelCorruptConfigAction
}

func showCorruptConfigPromptOnce() corruptConfigAction {
	corruptConfigPrompt.Lock()
	defer corruptConfigPrompt.Unlock()

	if corruptConfigPrompt.displayed {
		return cancelCorruptConfigAction
	}

	corruptConfigPrompt.displayed = true
	return showCorruptConfigPrompt()
}

func clearCorruptConfigPrompt() {
	corruptConfigPrompt.Lock()
	defer corruptConfigPrompt.Unlock()

	corruptConfigPrompt.displayed = false
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
	WorkshopPath = ""
	WallpaperEnginePath = ""

	// Try to get from config first
	conf, err := ReadConfig()
	if err != nil {
		return err
	}

	workshopSuffix := "steamapps/workshop/content/431960"
	wallpaperEngineSuffix := "steamapps/common/wallpaper_engine"
	steamPaths := conf.SteamPaths
	if len(steamPaths) == 0 {
		steamPaths = DefaultConfig.SteamPaths
	}

	// 1. Resolve Wallpaper Engine Path
	if conf.WallpaperEngineDir != "" {
		WallpaperEnginePath = resolvePath(conf.WallpaperEngineDir)
	}

	if WallpaperEnginePath == "" {
		// Auto-detect from steam paths
		for _, p := range steamPaths {
			steamRoot := resolvePath(p)
			fullPath := filepath.Join(steamRoot, wallpaperEngineSuffix)
			if _, err := os.Stat(fullPath); err == nil {
				WallpaperEnginePath = fullPath
				break
			}
		}
	}

	// 2. Resolve Workshop Path
	if conf.WorkshopDir != "" {
		WorkshopPath = resolvePath(conf.WorkshopDir)
	}

	// Try to derive workshop from assets if still missing
	if WorkshopPath == "" && WallpaperEnginePath != "" {
		derived := filepath.Join(WallpaperEnginePath, "../../workshop/content/431960")
		if _, err := os.Stat(derived); err == nil {
			WorkshopPath = derived
		}
	}

	if WorkshopPath == "" {
		// Auto-detect from steam paths
		for _, p := range steamPaths {
			steamRoot := resolvePath(p)
			fullPath := filepath.Join(steamRoot, workshopSuffix)
			if _, err := os.Stat(fullPath); err == nil {
				WorkshopPath = fullPath
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
			clearCorruptConfigPrompt()
			return DefaultConfig, nil
		}
		return DefaultConfig, err
	}

	conf := DefaultConfig
	if err := json.Unmarshal(data, &conf); err != nil {
		switch showCorruptConfigPromptOnce() {
		case resetCorruptConfigAction:
			if werr := WriteConfig(DefaultConfig); werr == nil {
				clearCorruptConfigPrompt()
				return DefaultConfig, nil
			}
		case openCorruptConfigInEditorAction:
			if openErr := OpenConfigEditor(); openErr != nil {
				return DefaultConfig, openErr
			}
		}
		return DefaultConfig, err
	}

	// Merge with defaults if necessary
	if conf.FPS == 0 {
		conf.FPS = 60
	}

	clearCorruptConfigPrompt()
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
