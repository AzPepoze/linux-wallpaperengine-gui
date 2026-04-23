package app

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"linux-wallpaperengine-gui/src/backend/internal/api"
	"linux-wallpaperengine-gui/src/backend/internal/api/handlers"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/core/playlist"
	"linux-wallpaperengine-gui/src/backend/internal/core/wallpaper"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/platform/display"
	"linux-wallpaperengine-gui/src/backend/internal/platform/fullscreen"
	"linux-wallpaperengine-gui/src/backend/internal/platform/notification"
	"linux-wallpaperengine-gui/src/backend/internal/platform/process"
	"linux-wallpaperengine-gui/src/backend/internal/ui/electron"
	"linux-wallpaperengine-gui/src/backend/internal/ui/tray"
)

type App struct {
	socketPath       string
	options          Options
	processManager   *process.Manager
	wallpaperService *wallpaper.Service
	playlistService  *playlist.Service
}

func NewApp(options Options) *App {
	processManager := process.NewManager()
	wallpaperService := wallpaper.NewService(processManager)
	playlistService := playlist.NewService(wallpaperService)

	return &App{
		socketPath:       filepath.Join(os.TempDir(), "linux-wallpaperengine-gui.sock"),
		options:          options,
		processManager:   processManager,
		wallpaperService: wallpaperService,
		playlistService:  playlistService,
	}
}

func (application *App) Run() {
	// Detect and log Wayland session
	if electron.IsWaylandSession() {
		logger.Println("⚠️  Wayland session detected")
	}

	// Handle single instance
	if application.handleSingleInstance() {
		return
	}

	// Ensure config is initialized
	if err := config.EnsureInitialized(); err != nil {
		logger.Printf("Failed to initialize config: %v", err)
	}

	// Start components
	application.setupDisplayWatcher()
	application.setupFullscreenDetector()
	application.applyInitialWallpapers()
	application.setupTray()
	application.handleSignals()

	// Start socket server
	apiHandler := handlers.NewHandler(application.wallpaperService, application.playlistService, application.Cleanup)
	go api.StartServer(application.socketPath, apiHandler)

	// Start UI if not minimized
	if !application.options.Minimized {
		go electron.Start()
	} else {
		logger.Println("Starting in minimized mode")
	}

	// Run tray loop (blocking)
	tray.Run()
}

func (application *App) handleSingleInstance() bool {
	connection, err := net.Dial("unix", application.socketPath)
	if err == nil {
		if !application.options.Minimized {
			fmt.Println("Another instance is already running. Opening UI...")
			encoder := json.NewEncoder(connection)
			request := models.Request{
				ID:     999,
				Method: "open-ui",
			}
			if err := encoder.Encode(request); err != nil {
				fmt.Printf("Failed to notify running instance: %v\n", err)
			}
		}
		if err := connection.Close(); err != nil {
			fmt.Printf("Error closing connection: %v\n", err)
		}
		return true
	}
	return false
}

func (application *App) setupDisplayWatcher() {
	display.StartWatcher(func() {
		logger.Println("Displays changed, broadcasting and re-applying wallpapers...")
		if err := application.wallpaperService.ApplyWallpapers(); err != nil {
			logger.Printf("Failed to apply wallpapers on display change: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to apply wallpapers on display change: "+err.Error())
		}
		api.BroadcastEvent("screens-changed", nil)
	})
}

func (application *App) setupFullscreenDetector() {
	fullscreen.StartDetector(func(isFullscreen bool) {
		if isFullscreen {
			application.playlistService.PausePlaylistCycle()
		} else {
			application.playlistService.ResumePlaylistCycle()
		}
	})
}

func (application *App) applyInitialWallpapers() {
	go func() {
		if err := application.wallpaperService.ApplyWallpapers(); err != nil {
			logger.Printf("Failed to apply wallpapers on startup: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to apply wallpapers on startup: "+err.Error())
		}

		appConfig, err := config.ReadConfig()
		if err != nil {
			logger.Printf("Failed to read config: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to read config: "+err.Error())
			return
		}

		for _, screen := range appConfig.Screens {
			if screen.Playlist != "" {
				if err := application.playlistService.StartPlaylistCycle(screen.Name); err != nil {
					logger.Printf("Failed to start playlist cycle for screen %s: %v", screen.Name, err)
				}
			}
		}
	}()
}

func (application *App) setupTray() {
	tray.RegisterCallbacks(
		func() { // Open callback
			if !electron.IsRunning() {
				go electron.Start()
			}
		},
		func() { // Close callback
			if electron.IsRunning() {
				logger.Println("Closing UI to tray...")
				electron.Stop()
			}
		},
		func() { // Quit callback
			application.Cleanup()
			os.Exit(0)
		},
	)
}

func (application *App) handleSignals() {
	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-signalChannel
		logger.Println("Received termination signal")
		application.Cleanup()
		os.Exit(0)
	}()
}

func (application *App) Cleanup() {
	logger.Println("Performing cleanup...")
	application.processManager.KillAll()
	fullscreen.StopDetector()
	electron.Stop()
	if _, err := os.Stat(application.socketPath); err == nil {
		if err := os.Remove(application.socketPath); err != nil {
			logger.Printf("Error removing socket file during cleanup: %v", err)
		}
	}
	tray.Quit()
}
