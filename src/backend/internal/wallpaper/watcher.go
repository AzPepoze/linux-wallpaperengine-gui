package wallpaper

import (
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os"
	"time"

	"github.com/fsnotify/fsnotify"
)

var (
	watcher *fsnotify.Watcher
)

func StartWallpaperWatcher(onChange func(path string, op string)) {
	if watcher != nil {
		return
	}

	err := config.EnsureInitialized()
	if err != nil {
		logger.Printf("Failed to initialize config for watcher: %v", err)
		return
	}

	basePath := config.WallpaperPath
	if _, err := os.Stat(basePath); os.IsNotExist(err) {
		logger.Printf("Wallpaper path does not exist, watcher not started: %s", basePath)
		return
	}

	w, err := fsnotify.NewWatcher()
	if err != nil {
		logger.Printf("Failed to create fs watcher: %v", err)
		return
	}
	watcher = w

	go func() {
		var timer *time.Timer
		const debounceDuration = 500 * time.Millisecond

		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				// We care about folder creation, removal, and renaming
				if event.Op&fsnotify.Create == fsnotify.Create ||
					event.Op&fsnotify.Remove == fsnotify.Remove ||
					event.Op&fsnotify.Rename == fsnotify.Rename {

					if timer != nil {
						timer.Stop()
					}

					timer = time.AfterFunc(debounceDuration, func() {
						logger.Printf("Wallpaper folder changed (debounced): %s (%s)", event.Name, event.Op)
						if onChange != nil {
							onChange(event.Name, event.Op.String())
						}
					})
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				logger.Printf("Watcher error: %v", err)
			}
		}
	}()

	err = watcher.Add(basePath)
	if err != nil {
		logger.Printf("Failed to add path to watcher: %v", err)
	} else {
		logger.Printf("Started watching wallpaper directory: %s", basePath)
	}
}

func StopWallpaperWatcher() {
	if watcher != nil {
		if err := watcher.Close(); err != nil {
			logger.Printf("Error closing wallpaper watcher: %v", err)
		}
		watcher = nil
	}
}
