package api

import (
	"encoding/json"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/display"
	"linux-wallpaperengine-gui/src/backend/internal/electron"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
	"os"
	"time"
)

func handleIPC(req Request, encoder *json.Encoder, cleanup func()) Response {
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
		if err := wallpaper.ApplyWallpapers(); err != nil {
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
			if err := config.WriteConfig(conf); err != nil {
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
		if err := config.EnsureInitialized(); err != nil {
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
	case "create-playlist":
		var params struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.CreatePlaylist(params.Name); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "rename-playlist":
		var params struct {
			OldName string `json:"oldName"`
			NewName string `json:"newName"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.RenamePlaylist(params.OldName, params.NewName); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "delete-playlist":
		var params struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.DeletePlaylist(params.Name); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "update-playlist-wallpapers":
		var params struct {
			Name  string   `json:"name"`
			Items []string `json:"items"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.UpdatePlaylistItems(params.Name, params.Items); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "start-playlist":
		var params struct {
			PlaylistName    string  `json:"playlistName"`
			IntervalMinutes float64 `json:"intervalMinutes"`
			ScreenName      string  `json:"screenName"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			screenName := params.ScreenName
			if screenName == "" {
				screenName = "Global"
			}
			conf, err := config.ReadConfig()
			if err != nil {
				res.Error = fmt.Sprintf("failed to read config: %v", err)
			} else {
				conf.Playlist = params.PlaylistName
				conf.PlaylistInterval = params.IntervalMinutes
				if err := config.WriteConfig(conf); err != nil {
					res.Error = fmt.Sprintf("failed to write config: %v", err)
				} else {
					if err := wallpaper.StartPlaylistCycle(screenName); err != nil {
						res.Error = err.Error()
					} else {
						res.Result = map[string]bool{"success": true}
					}
				}
			}
		}
	case "stop-playlist":
		var stopParams struct {
			ScreenName string `json:"screenName"`
		}
		screenName := "Global"
		if err := json.Unmarshal(req.Params, &stopParams); err == nil && stopParams.ScreenName != "" {
			screenName = stopParams.ScreenName
		}
		wallpaper.StopPlaylistCycle(screenName)
		res.Result = map[string]bool{"success": true}
	case "update-playlist-interval":
		var params struct {
			PlaylistName    string  `json:"playlistName"`
			IntervalMinutes float64 `json:"intervalMinutes"`
			ScreenName      string  `json:"screenName"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			res.Error = err.Error()
		} else {
			screenName := params.ScreenName
			if screenName == "" {
				screenName = "Global"
			}
			if err := wallpaper.UpdatePlaylistIntervalConfig(params.PlaylistName, params.IntervalMinutes); err != nil {
				res.Error = err.Error()
			} else {
				if conf, err := config.ReadConfig(); err == nil {
					conf.PlaylistInterval = params.IntervalMinutes
					config.WriteConfig(conf)
				}
				if err := wallpaper.UpdatePlaylistInterval(screenName, params.IntervalMinutes); err != nil {
					res.Error = err.Error()
				} else {
					res.Result = map[string]bool{"success": true}
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
		if err := config.OpenConfigEditor(); err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]bool{"success": true}
		}
	default:
		res.Error = fmt.Sprintf("Unknown method: %s", req.Method)
	}
	return res
}
