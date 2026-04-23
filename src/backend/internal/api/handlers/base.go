package handlers

import (
	"encoding/json"
	"fmt"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/core/playlist"
	"linux-wallpaperengine-gui/src/backend/internal/core/wallpaper"
)

type Handler struct {
	wallpaperService *wallpaper.Service
	playlistService  *playlist.Service
	cleanupFunc      func()
}

func NewHandler(wallpaperService *wallpaper.Service, playlistService *playlist.Service, cleanupFunc func()) *Handler {
	return &Handler{
		wallpaperService: wallpaperService,
		playlistService:  playlistService,
		cleanupFunc:      cleanupFunc,
	}
}

func (handler *Handler) HandleIPC(request models.Request, encoder *json.Encoder) models.Response {
	switch request.Method {
	case "ping", "quit", "open-ui", "restart-ui":
		return handler.HandleSystem(request, encoder)

	case "get-config", "write-config", "open-config-editor", "toggle-autostart":
		return handler.HandleConfig(request)

	case "get-screens":
		return handler.HandleDisplay(request)

	case "apply-wallpapers", "load-wallpapers", "get-wallpaper-project-data",
		"get-wallpaper-base-path", "get-assets-base-path", "kill-all-wallpapers", "kill-wallpaper":
		return handler.HandleWallpaper(request)

	case "get-playlists", "create-playlist", "rename-playlist", "delete-playlist",
		"update-playlist-wallpapers", "start-playlist", "stop-playlist",
		"update-playlist-interval", "get-playlist-status":
		return handler.HandlePlaylist(request)

	case "get-installed-filters", "save-installed-filters", "get-workshop-filters", "save-workshop-filters":
		return handler.HandleFilter(request)

	default:
		return models.Response{
			ID:    request.ID,
			Error: fmt.Sprintf("unknown method: %s", request.Method),
		}
	}
}
