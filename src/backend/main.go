package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"linux-wallpaperengine-gui/src/backend/internal/api"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/display"
	"linux-wallpaperengine-gui/src/backend/internal/electron"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/notification"
	"linux-wallpaperengine-gui/src/backend/internal/tray"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
)

var socketPath string

func main() {
	socketPath = filepath.Join(os.TempDir(), "linux-wallpaperengine-gui.sock")

	// Detect and log Wayland session
	if electron.IsWaylandSession() {
		logger.Println("⚠️  Wayland session detected")
	}

	// Handle --minimized
	minimized := false
	for _, arg := range os.Args {
		if arg == "--minimized" {
			minimized = true
			break
		}
	}

	// Try to connect to existing socket
	conn, err := net.Dial("unix", socketPath)
	if err == nil {
		if !minimized {
			// Another instance is running
			fmt.Println("Another instance is already running. Opening UI...")
			encoder := json.NewEncoder(conn)
			req := api.Request{
				ID:     999,
				Method: "open-ui",
			}
			if err := encoder.Encode(req); err != nil {
				fmt.Printf("Failed to notify running instance: %v\n", err)
			}
		}
		if err := conn.Close(); err != nil {
			fmt.Printf("Error closing connection: %v\n", err)
		}
		os.Exit(0)
	}

	cleanup := func() {
		wallpaper.KillAll()
		electron.Stop()
		if _, err := os.Stat(socketPath); err == nil {
			if err := os.Remove(socketPath); err != nil {
				logger.Printf("Error removing socket file during cleanup: %v", err)
			}
		}
		tray.Quit()
	}

	// Ensure config is initialized
	if err := config.EnsureInitialized(); err != nil {
		logger.Printf("Failed to initialize config: %v", err)
	}

	// Start display watcher
	display.StartWatcher(func() {
		logger.Println("Displays changed, broadcasting and re-applying wallpapers...")
		if err := wallpaper.ApplyWallpapers(); err != nil {
			logger.Printf("Failed to apply wallpapers on display change: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to apply wallpapers on display change: "+err.Error())
		}
		api.BroadcastEvent("screens-changed", nil)
	})

	// Apply wallpapers on startup
	go func() {
		if err := wallpaper.ApplyWallpapers(); err != nil {
			logger.Printf("Failed to apply wallpapers on startup: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to apply wallpapers on startup: "+err.Error())
		}
	}()

	// Register tray callbacks
	tray.RegisterCallbacks(func() {
		if !electron.IsRunning() {
			go electron.Start()
		}
	}, func() {
		if electron.IsRunning() {
			logger.Println("Closing UI to tray...")
			electron.Stop()
		}
	}, func() {
		cleanup()
		os.Exit(0)
	})

	// Handle signals for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		logger.Println("Received termination signal")
		cleanup()
		os.Exit(0)
	}()

	// Start socket server in a goroutine
	go api.StartServer(socketPath, cleanup)

	if !minimized {
		go electron.Start()
	} else {
		logger.Println("Starting in minimized mode")
	}

	tray.Run()
}
