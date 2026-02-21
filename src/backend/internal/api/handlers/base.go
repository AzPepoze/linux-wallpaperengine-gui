package handlers

import (
	"encoding/json"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
)

type handlerFn func(req models.Request, encoder *json.Encoder, cleanup func()) models.Response

var dispatchTable = map[string]handlerFn{
	"ping":    wrapSystem,
	"quit":    wrapSystem,
	"open-ui": wrapSystem,

	"get-config":         wrapConfig,
	"write-config":       wrapConfig,
	"open-config-editor": wrapConfig,

	"get-screens": wrapDisplay,

	"apply-wallpapers":           wrapWallpaper,
	"load-wallpapers":            wrapWallpaper,
	"get-wallpaper-project-data": wrapWallpaper,
	"get-wallpaper-base-path":    wrapWallpaper,
	"kill-all-wallpapers":        wrapWallpaper,

	"get-playlists":              wrapPlaylist,
	"create-playlist":            wrapPlaylist,
	"rename-playlist":            wrapPlaylist,
	"delete-playlist":            wrapPlaylist,
	"update-playlist-wallpapers": wrapPlaylist,
	"start-playlist":             wrapPlaylist,
	"stop-playlist":              wrapPlaylist,
	"update-playlist-interval":   wrapPlaylist,
	"get-playlist-status":        wrapPlaylist,

	"get-installed-filters":  wrapFilter,
	"save-installed-filters": wrapFilter,
	"get-workshop-filters":   wrapFilter,
	"save-workshop-filters":  wrapFilter,
}

func HandleIPC(req models.Request, encoder *json.Encoder, cleanup func()) models.Response {
	handler, exists := dispatchTable[req.Method]
	if !exists {
		return models.Response{
			ID:    req.ID,
			Error: fmt.Sprintf("unknown method: %s", req.Method),
		}
	}
	return handler(req, encoder, cleanup)
}

func wrapSystem(req models.Request, encoder *json.Encoder, cleanup func()) models.Response {
	return HandleSystem(req, encoder, cleanup)
}

func wrapConfig(req models.Request, _ *json.Encoder, _ func()) models.Response {
	return HandleConfig(req)
}

func wrapDisplay(req models.Request, _ *json.Encoder, _ func()) models.Response {
	return HandleDisplay(req)
}

func wrapWallpaper(req models.Request, _ *json.Encoder, _ func()) models.Response {
	return HandleWallpaper(req)
}

func wrapPlaylist(req models.Request, _ *json.Encoder, _ func()) models.Response {
	return HandlePlaylist(req)
}

func wrapFilter(req models.Request, _ *json.Encoder, _ func()) models.Response {
	return HandleFilter(req)
}
