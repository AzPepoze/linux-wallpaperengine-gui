package tray

import (
	"fmt"
	"os"
	"path/filepath"

	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/i18n"
	"linux-wallpaperengine-gui/src/backend/internal/logger"

	"github.com/getlantern/systray"
)

var (
	onShow             func()
	onClose            func()
	onRestartWallpaper func()
	onQuit             func()

	menuLanguage string
	menuShow     *systray.MenuItem
	menuClose    *systray.MenuItem
	menuRestart  *systray.MenuItem
	menuQuit     *systray.MenuItem
)

func RegisterCallbacks(show func(), close func(), restart func(), quit func()) {
	onShow = show
	onClose = close
	onRestartWallpaper = restart
	onQuit = quit
}

func Run() {
	systray.Run(onReady, onExit)
}

func onReady() {
	// Try to find the icon
	executable, _ := os.Executable()
	appDir := filepath.Dir(executable)
	cwd, _ := os.Getwd()

	// Potential icon paths in order of priority
	iconPaths := []string{
		filepath.Join(cwd, "src", "public", "icon.png"), // dev
		filepath.Join(appDir, "icon.png"),               // next to binary
		"/usr/share/icons/hicolor/48x48/apps/linux-wallpaperengine-gui.png",
	}

	var iconData []byte
	var foundPath string
	for _, p := range iconPaths {
		data, err := os.ReadFile(p)
		if err == nil {
			iconData = data
			foundPath = p
			break
		}
	}

	if iconData != nil {
		fmt.Printf("[BACKEND] Found tray icon at: %s (%d bytes)\n", foundPath, len(iconData))
		systray.SetIcon(iconData)
	} else {
		fmt.Printf("[BACKEND] ERROR: Tray icon not found. Searched in: %v\n", iconPaths)
	}

	// Optionally hide the tray label per user config
	appConfig, err := config.ReadConfig()
	if err == nil && appConfig.HideTrayLabel {
		systray.SetTitle("")
		systray.SetTooltip("")
	} else {
		systray.SetTooltip("Linux Wallpaper Engine GUI")
		systray.SetTitle("Linux Wallpaper Engine GUI")
	}

	language := i18n.Resolve(appConfig.Language)
	menuLanguage = language

	menuShow = systray.AddMenuItem("", "")
	menuClose = systray.AddMenuItem("", "")
	menuRestart = systray.AddMenuItem("", "")
	systray.AddSeparator()
	menuQuit = systray.AddMenuItem("", "")
	relabel()

	go func() {
		for {
			select {
			case <-menuShow.ClickedCh:
				if onShow != nil {
					onShow()
				}
			case <-menuClose.ClickedCh:
				if onClose != nil {
					onClose()
				}
			case <-menuRestart.ClickedCh:
				if onRestartWallpaper != nil {
					onRestartWallpaper()
				}
			case <-menuQuit.ClickedCh:
				if onQuit != nil {
					onQuit()
				}
			}
		}
	}()
}

func onExit() {
	// Cleanup if needed
}

// SetLanguage relabels the tray menu in place. Unknown codes are ignored.
func SetLanguage(language string) {
	if !i18n.Available(language) {
		logger.Printf("Ignoring unknown tray language: %q", language)
		return
	}
	menuLanguage = language
	relabel()
}

func relabel() {
	text := func(key string) string { return i18n.T(menuLanguage, "tray.menu."+key) }

	menuShow.SetTitle(text("show"))
	menuShow.SetTooltip(text("showTooltip"))
	menuClose.SetTitle(text("hide"))
	menuClose.SetTooltip(text("hideTooltip"))
	menuRestart.SetTitle(text("restartWallpaper"))
	menuRestart.SetTooltip(text("restartWallpaperTooltip"))
	menuQuit.SetTitle(text("quit"))
	menuQuit.SetTooltip(text("quitTooltip"))
}

// UpdateTitle sets or hides the tray label at runtime (no restart needed).
func UpdateTitle(hide bool) {
	if hide {
		systray.SetTitle("")
		systray.SetTooltip("")
	} else {
		systray.SetTooltip("Linux Wallpaper Engine GUI")
		systray.SetTitle("Linux Wallpaper Engine GUI")
	}
}

func Quit() {
	systray.Quit()
}
