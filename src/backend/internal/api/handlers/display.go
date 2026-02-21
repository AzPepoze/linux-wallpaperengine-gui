package handlers

import (
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/display"
)

func HandleDisplay(req models.Request) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
	case "get-screens":
		screens, err := display.GetScreens()
		if err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]interface{}{"success": true, "screens": screens}
		}
	}

	return res
}
