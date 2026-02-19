package api

import (
	"encoding/json"
	"fmt"
	"io"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/display"
	"linux-wallpaperengine-gui/src/backend/internal/electron"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
	"net"
	"os"
	"sync"
	"time"
)

var (
	clients    []chan interface{}
	clientsMu  sync.Mutex
	socketPath string
)

func BroadcastEvent(method string, params interface{}) {
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

func StartServer(path string, cleanup func()) {
	socketPath = path
	if _, err := os.Stat(socketPath); err == nil {
		if err := os.Remove(socketPath); err != nil {
			logger.Error("Failed to remove existing socket file at %s: %v. Please check permissions or delete it manually.", socketPath, err)
		}
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		logger.Error("Failed to create socket listener at %s: %v. This usually happens if another instance is running or the path is not writable.", socketPath, err)
	}
	defer func() {
		if err := listener.Close(); err != nil {
			logger.Println("Error closing listener:", err)
		}
	}()

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

func handleConnection(conn net.Conn, cleanup func()) {
	defer func() {
		if err := conn.Close(); err != nil {
			logger.Println("Error closing connection:", err)
		}
	}()
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
			if err := encoder.Encode(res); err != nil {
				logger.Println("Encode error during quit:", err)
			}
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
		case "get-playlists":
			playlists, err := wallpaper.GetPlaylists()
			if err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]interface{}{"success": true, "playlists": playlists}
			}
		case "start-playlist":
			var params struct {
				PlaylistName    string `json:"playlistName"`
				IntervalMinutes int    `json:"intervalMinutes"`
			}
			if err := json.Unmarshal(req.Params, &params); err != nil {
				res.Error = err.Error()
			} else {
				// Update config with playlist and interval
				conf, err := config.ReadConfig()
				if err != nil {
					res.Error = fmt.Sprintf("failed to read config: %v", err)
				} else {
					conf.Playlist = params.PlaylistName
					conf.PlaylistInterval = params.IntervalMinutes
					if err := config.WriteConfig(conf); err != nil {
						res.Error = fmt.Sprintf("failed to write config: %v", err)
					} else {
						// Start playlist cycle
						err := wallpaper.StartPlaylistCycle()
						if err != nil {
							res.Error = err.Error()
						} else {
							res.Result = map[string]bool{"success": true}
						}
					}
				}
			}
		case "stop-playlist":
			wallpaper.StopPlaylistCycle()
			res.Result = map[string]bool{"success": true}
		case "update-playlist-interval":
			var params struct {
				IntervalMinutes int `json:"intervalMinutes"`
			}
			if err := json.Unmarshal(req.Params, &params); err != nil {
				res.Error = err.Error()
			} else {
				// Update config with new interval
				conf, err := config.ReadConfig()
				if err != nil {
					res.Error = fmt.Sprintf("failed to read config: %v", err)
				} else {
					conf.PlaylistInterval = params.IntervalMinutes
					if err := config.WriteConfig(conf); err != nil {
						res.Error = fmt.Sprintf("failed to write config: %v", err)
					} else {
						// Update the ticker interval without restarting playlist
						err := wallpaper.UpdatePlaylistInterval(params.IntervalMinutes)
						if err != nil {
							res.Error = err.Error()
						} else {
							res.Result = map[string]bool{"success": true}
						}
					}
				}
			}
		case "get-playlist-status":
			status := wallpaper.GetPlaylistStatus()
			res.Result = map[string]interface{}{"success": true, "status": status}
		case "kill-all-wallpapers":
			wallpaper.KillAllWallpapers()
			res.Result = map[string]bool{"success": true}
		case "open-ui":
			if !electron.IsRunning() {
				go electron.Start()
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
