package config

import (
	"os"
	"path/filepath"
)

func ToggleAutostart(enabled bool) error {
	directory := filepath.Dir(AutostartPath)
	if enabled {
		if _, err := os.Stat(directory); os.IsNotExist(err) {
			if err := os.MkdirAll(directory, 0755); err != nil {
				return err
			}
		}
		data := `[Desktop Entry]
Name=Linux Wallpaper Engine GUI
Comment=Manage wallpapers for linux-wallpaperengine
Exec=linux-wallpaperengine-gui --minimized
Icon=linux-wallpaperengine-gui
Terminal=false
Type=Application
Categories=Utility;
`
		return os.WriteFile(AutostartPath, []byte(data), 0644)
	} else {
		if _, err := os.Stat(directory); os.IsNotExist(err) {
			return err
		}
		return os.Remove(AutostartPath)
	}
}
