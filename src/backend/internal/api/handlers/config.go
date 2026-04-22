package handlers

import (
	"encoding/json"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
)

func (handler *Handler) HandleConfig(request models.Request) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "get-config":
		appConfig, err := config.GetConfig()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = appConfig
		}
	case "write-config":
		var appConfig config.AppConfig
		if err := json.Unmarshal(request.Params, &appConfig); err != nil {
			response.Error = err.Error()
		} else {
			if err := config.WriteConfig(appConfig); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "toggle-autostart":
		var enabled bool
		if err := json.Unmarshal(request.Params, &enabled); err != nil {
			response.Error = err.Error()
		} else {
			if err := config.ToggleAutostart(enabled); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}

	case "open-config-editor":
		if err := config.OpenConfigEditor(); err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]bool{"success": true}
		}
	}

	return response
}
