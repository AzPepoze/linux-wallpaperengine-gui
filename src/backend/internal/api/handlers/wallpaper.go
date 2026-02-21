package handlers

import (
	"encoding/json"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
)

func HandleWallpaper(req models.Request) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
	case "apply-wallpapers":
		if err := wallpaper.ApplyWallpapers(); err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]bool{"success": true}
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
	case "kill-all-wallpapers":
		wallpaper.KillAllWallpapers()
		res.Result = map[string]bool{"success": true}
	}

	return res
}
