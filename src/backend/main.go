package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/display"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/notification"
	"linux-wallpaperengine-gui/src/backend/internal/tray"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
)

type Request struct {
	ID     int             `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type Response struct {
	ID     int         `json:"id"`
	Result interface{} `json:"result,omitempty"`
	Error  string      `json:"error,omitempty"`
}

type Event struct {
	Method string      `json:"method"`
	Params interface{} `json:"params"`
}

var electronProcess *os.Process
var socketPath string

var (
	clients   []chan interface{}
	clientsMu sync.Mutex
)

func broadcastEvent(method string, params interface{}) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	event := Event{Method: method, Params: params}
	for _, ch := range clients {
		select {
		case ch <- event:
		default:
			// Drop if channel is full
		}
	}
}

func main() {
	socketPath = filepath.Join(os.TempDir(), "linux-wallpaperengine-gui.sock")

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
			req := Request{
				ID:     999,
				Method: "open-ui",
			}
			encoder.Encode(req)
		}
		conn.Close()
		os.Exit(0)
	}

	cleanup := func() {
		wallpaper.KillAll()
		stopElectron()
		if _, err := os.Stat(socketPath); err == nil {
			os.Remove(socketPath)
		}
		tray.Quit()
	}

	// Ensure config is initialized
	config.EnsureInitialized()

	// Start display watcher
	display.StartWatcher(func() {
		logger.Println("Displays changed, broadcasting and re-applying wallpapers...")
		if err := wallpaper.ApplyWallpapers(); err != nil {
			logger.Printf("Failed to apply wallpapers on display change: %v", err)
			notification.Error("Wallpaper Engine Error", "Failed to apply wallpapers on display change: "+err.Error())
		}
		broadcastEvent("screens-changed", nil)
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
		if electronProcess == nil {
			go startElectron()
		}
	}, func() {
		if electronProcess != nil {
			logger.Println("Closing UI to tray...")
			stopElectron()
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
	go startSocketServer(cleanup)

	if !minimized {
		go startElectron()
	} else {
		logger.Println("Starting in minimized mode")
	}

	tray.Run()
}

func startSocketServer(cleanup func()) {
	if _, err := os.Stat(socketPath); err == nil {
		if err := os.Remove(socketPath); err != nil {
			logger.Error("Failed to remove existing socket file at %s: %v. Please check permissions or delete it manually.", socketPath, err)
		}
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		logger.Error("Failed to create socket listener at %s: %v. This usually happens if another instance is running or the path is not writable.", socketPath, err)
	}
	defer listener.Close()

	logger.Printf("Listening on %s", socketPath)

	for {
		conn, err := listener.Accept()
		if err != nil {
			logger.Println("Accept error:", err)
			continue
		}
		go handleConnection(conn, cleanup)
	}
}

func startElectron() {
	var cmd *exec.Cmd
	executable, _ := os.Executable()
	appDir := filepath.Dir(executable)

	// In production, the backend is located in the 'resources' folder
	if filepath.Base(appDir) == "resources" {
		logger.Println("Production mode detected...")

		// The Electron binary is in: [AppRoot]/linux-wallpaperengine-gui-electron
		electronPath := filepath.Join(appDir, "..", "linux-wallpaperengine-gui-electron")

		if _, err := os.Stat(electronPath); os.IsNotExist(err) {
			// Try same directory as a fallback
			electronPath = filepath.Join(appDir, "linux-wallpaperengine-gui-electron")
		}

		cmd = exec.Command(electronPath)
	} else {
		logger.Println("Dev mode detected, running via pnpm...")
		cmd = exec.Command("pnpm", "run", "dev:frontend")
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		logger.Error("Failed to start Electron: %v", err)
	}

	electronProcess = cmd.Process
	logger.Printf("Electron started (PID: %d)", electronProcess.Pid)

	err := cmd.Wait()
	logger.Printf("Electron process exited: %v", err)
	electronProcess = nil
}

func stopElectron() {
	if electronProcess != nil {
		logger.Println("Stopping Electron process...")
		electronProcess.Kill()
	}
}

func handleConnection(conn net.Conn, cleanup func()) {
	defer conn.Close()
	decoder := json.NewDecoder(conn)
	encoder := json.NewEncoder(conn)

	// Channel for all outgoing messages to this client
	outCh := make(chan interface{}, 100)

	clientsMu.Lock()
	clients = append(clients, outCh)
	clientsMu.Unlock()

	defer func() {
		clientsMu.Lock()
		for i, ch := range clients {
			if ch == outCh {
				clients = append(clients[:i], clients[i+1:]...)
				break
			}
		}
		clientsMu.Unlock()
	}()

	// Writing goroutine
	go func() {
		for msg := range outCh {
			if err := encoder.Encode(msg); err != nil {
				return
			}
		}
	}()

	// Subscribe to logs
	logCh := logger.Subscribe()
	go func() {
		for entry := range logCh {
			event := Event{
				Method: "log",
				Params: map[string]string{
					"type":    entry.Type,
					"message": entry.Message,
				},
			}
			select {
			case outCh <- event:
			default:
			}
		}
	}()

	for {
		var req Request
		if err := decoder.Decode(&req); err != nil {
			if err != io.EOF {
				logger.Println("Decode error:", err)
			}
			return
		}

		logger.Printf("Received: %s (ID: %d)", req.Method, req.ID)

		var res Response
		res.ID = req.ID

		switch req.Method {
		case "ping":
			res.Result = "pong"
		case "quit":
			res.Result = "ok"
			encoder.Encode(res)
			time.Sleep(100 * time.Millisecond)
			cleanup()
			os.Exit(0)
		case "apply-wallpapers":
			err := wallpaper.ApplyWallpapers()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		case "get-config":
			conf, err := config.GetConfig()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = conf
			}
		case "write-config":
			var conf config.AppConfig
			if err := json.Unmarshal(req.Params, &conf); err != nil {
				res.Error = err.Error()
			} else {
				err := config.WriteConfig(conf)
				if err != nil {
					res.Error = err.Error()
				} else {
					res.Result = map[string]bool{"success": true}
				}
			}
		case "get-screens":
			screens, err := display.GetScreens()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]interface{}{"success": true, "screens": screens}
			}
		case "load-wallpapers":
			result, err := wallpaper.LoadWallpapers()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]interface{}{
					"success":           true,
					"wallpapers":        result["wallpapers"],
					"selectedWallpaper": result["selectedWallpaper"],
				}
			}
		case "get-wallpaper-project-data":
			var params struct {
				ID string `json:"id"`
			}
			if err := json.Unmarshal(req.Params, &params); err != nil {
				res.Error = err.Error()
			} else {
				props, err := wallpaper.GetWallpaperProjectData(params.ID)
				if err != nil {
					res.Error = err.Error()
				} else {
					res.Result = map[string]interface{}{"success": true, "properties": props}
				}
			}
		case "get-wallpaper-base-path":
			err := config.EnsureInitialized()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = config.WallpaperPath
			}
		case "kill-all-wallpapers":
			wallpaper.KillAllWallpapers()
			res.Result = map[string]bool{"success": true}
		case "open-ui":
			if electronProcess == nil {
				go startElectron()
				res.Result = map[string]string{"status": "starting"}
			} else {
				res.Result = map[string]string{"status": "already_running"}
			}
		case "open-config-editor":
			err := config.OpenConfigEditor()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		default:
			res.Error = fmt.Sprintf("Unknown method: %s", req.Method)
		}

		if err := encoder.Encode(res); err != nil {
			logger.Println("Encode error:", err)
			return
		}
	}
}
