package handlers

import (
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/platform/display"
)

func (handler *Handler) HandleDisplay(request models.Request) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "get-screens":
		screens, err := display.GetScreens()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]interface{}{"success": true, "screens": screens}
		}
	}

	return response
}
