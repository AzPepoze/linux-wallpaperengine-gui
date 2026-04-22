package handlers

import (
	"encoding/json"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/core/wallpaper"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
)

func (handler *Handler) HandleWallpaper(request models.Request) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "apply-wallpapers":
		if err := handler.wallpaperService.ApplyWallpapers(); err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]bool{"success": true}
		}
	case "load-wallpapers":
		if err := config.EnsureInitialized(); err != nil {
			logger.Printf("Failed to ensure config initialized in load-wallpapers: %v", err)
		}
		result, err := handler.wallpaperService.LoadWallpapers()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]interface{}{
				"success":                  true,
				"wallpapers":               result["wallpapers"],
				"selectedWallpaper":        result["selectedWallpaper"],
				"workshopPathValid":        result["workshopPathValid"],
				"wallpaperEnginePathValid": result["wallpaperEnginePathValid"],
			}
		}
	case "get-wallpaper-project-data":
		var parameters struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			properties, err := wallpaper.GetWallpaperProjectData(parameters.ID)
			if err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]interface{}{"success": true, "properties": properties}
			}
		}
	case "get-wallpaper-base-path":
		if err := config.EnsureInitialized(); err != nil {
			response.Error = err.Error()
		} else {
			response.Result = config.WorkshopPath
		}
	case "get-assets-base-path":
		if err := config.EnsureInitialized(); err != nil {
			response.Error = err.Error()
		} else {
			response.Result = config.WallpaperEnginePath
		}
	case "kill-all-wallpapers":
		handler.wallpaperService.KillAllWallpapers()
		response.Result = map[string]bool{"success": true}
	case "kill-wallpaper":
		var parameters struct {
			FolderName string `json:"folderName"`
		}
		if err := json.Unmarshal(request.Params, &parameters); err != nil {
			response.Error = err.Error()
		} else {
			handler.wallpaperService.KillWallpaperByFolderName(parameters.FolderName)
			response.Result = map[string]bool{"success": true}
		}
	}

	return response
}
