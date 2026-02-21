package handlers

import (
	"encoding/json"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
)

func HandlePlaylist(req models.Request) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
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
				} else if err := wallpaper.StartPlaylistCycle(screenName); err != nil {
					res.Error = err.Error()
				} else {
					res.Result = map[string]bool{"success": true}
				}
			}
		}
	case "stop-playlist":
		var params struct {
			ScreenName string `json:"screenName"`
		}
		screenName := "Global"
		if err := json.Unmarshal(req.Params, &params); err == nil && params.ScreenName != "" {
			screenName = params.ScreenName
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
					_ = config.WriteConfig(conf)
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
	}

	return res
}
