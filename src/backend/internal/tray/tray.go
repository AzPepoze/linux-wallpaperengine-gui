package tray

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/getlantern/systray"
)

var (
	onShow  func()
	onClose func()
	onQuit  func()
)

func RegisterCallbacks(show func(), close func(), quit func()) {
	onShow = show
	onClose = close
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
		filepath.Join(cwd, "src", "public", "icon.png"),          // pnpm dev (root)
		filepath.Join(appDir, "..", "src", "public", "icon.png"), // relative to binary
		filepath.Join(appDir, "icon.png"),                        // next to binary
		filepath.Join(appDir, "..", "icon.png"),                  // one level up
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

	systray.SetTooltip("Linux Wallpaper Engine GUI")
	systray.SetTitle("Linux Wallpaper Engine GUI")

	mShow := systray.AddMenuItem("Show", "Open the GUI")
	mClose := systray.AddMenuItem("Hide", "Hide the GUI to system tray")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Exit completely")

	go func() {
		for {
			select {
			case <-mShow.ClickedCh:
				if onShow != nil {
					onShow()
				}
			case <-mClose.ClickedCh:
				if onClose != nil {
					onClose()
				}
			case <-mQuit.ClickedCh:
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

func Quit() {
	systray.Quit()
}
