package handlers

import (
	"encoding/json"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/wallpaper"
)

func HandleFilter(req models.Request) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
	case "get-installed-filters":
		filters, err := wallpaper.GetInstalledFilters()
		if err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]interface{}{"success": true, "filters": filters}
		}
	case "save-installed-filters":
		var filters wallpaper.FilterConfig
		if err := json.Unmarshal(req.Params, &filters); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.SaveInstalledFilters(filters); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "get-workshop-filters":
		filters, err := wallpaper.GetWorkshopFilters()
		if err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]interface{}{"success": true, "filters": filters}
		}
	case "save-workshop-filters":
		var filters wallpaper.FilterConfig
		if err := json.Unmarshal(req.Params, &filters); err != nil {
			res.Error = err.Error()
		} else {
			if err := wallpaper.SaveWorkshopFilters(filters); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	}

	return res
}
