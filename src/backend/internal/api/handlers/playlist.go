package handlers

import (
	"encoding/json"
	"fmt"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/core/playlist"
)

func (handler *Handler) HandlePlaylist(request models.Request) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "get-playlists":
		playlists, err := playlist.GetPlaylists()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]interface{}{"success": true, "playlists": playlists}
		}
	case "create-playlist":
		var parameters struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			if err := playlist.CreatePlaylist(parameters.Name); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "rename-playlist":
		var parameters struct {
			OldName string `json:"oldName"`
			NewName string `json:"newName"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			if err := playlist.RenamePlaylist(parameters.OldName, parameters.NewName); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "delete-playlist":
		var parameters struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			if err := playlist.DeletePlaylist(parameters.Name); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "update-playlist-wallpapers":
		var parameters struct {
			Name  string   `json:"name"`
			Items []string `json:"items"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			if err := playlist.UpdatePlaylistItems(parameters.Name, parameters.Items); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "start-playlist":
		var parameters struct {
			PlaylistName    string  `json:"playlistName"`
			IntervalMinutes float64 `json:"intervalMinutes"`
			ScreenName      string  `json:"screenName"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			screenName := parameters.ScreenName
			if screenName == "" {
				screenName = "Global"
			}
			appConfig, err := config.ReadConfig()
			if err != nil {
				response.Error = fmt.Sprintf("failed to read config: %v", err)
			} else {
				appConfig.Playlist = parameters.PlaylistName
				appConfig.PlaylistInterval = parameters.IntervalMinutes
				if err := config.WriteConfig(appConfig); err != nil {
					response.Error = fmt.Sprintf("failed to write config: %v", err)
				} else if err := handler.playlistService.StartPlaylistCycle(screenName); err != nil {
					response.Error = err.Error()
				} else {
					response.Result = map[string]bool{"success": true}
				}
			}
		}
	case "stop-playlist":
		var parameters struct {
			ScreenName string `json:"screenName"`
		}
		screenName := "Global"
		if err := json.Unmarshal(request.Params, &parameters); err == nil && parameters.ScreenName != "" {
			screenName = parameters.ScreenName
		}
		handler.playlistService.StopPlaylistCycle(screenName)
		response.Result = map[string]bool{"success": true}
	case "update-playlist-interval":
		var parameters struct {
			PlaylistName    string  `json:"playlistName"`
			IntervalMinutes float64 `json:"intervalMinutes"`
			ScreenName      string  `json:"screenName"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			screenName := parameters.ScreenName
			if screenName == "" {
				screenName = "Global"
			}
			if err := playlist.UpdatePlaylistIntervalConfig(parameters.PlaylistName, parameters.IntervalMinutes); err != nil {
				response.Error = err.Error()
			} else {
				if appConfig, err := config.ReadConfig(); err == nil {
					appConfig.PlaylistInterval = parameters.IntervalMinutes
					_ = config.WriteConfig(appConfig)
				}
				if err := handler.playlistService.UpdatePlaylistInterval(screenName, parameters.IntervalMinutes); err != nil {
					response.Error = err.Error()
				} else {
					response.Result = map[string]bool{"success": true}
				}
			}
		}
	case "get-playlist-status":
		status := handler.playlistService.GetPlaylistStatus()
		response.Result = map[string]interface{}{"success": true, "status": status}
	}

	return response
}
