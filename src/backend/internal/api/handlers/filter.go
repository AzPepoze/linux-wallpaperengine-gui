package handlers

import (
	"encoding/json"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/core/filter"
)

func (handler *Handler) HandleFilter(request models.Request) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "get-installed-filters":
		filters, err := filter.GetInstalledFilters()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]interface{}{"success": true, "filters": filters}
		}
	case "save-installed-filters":
		var filters config.FilterConfig
		if err := json.Unmarshal(request.Params, &filters); err != nil {
			response.Error = err.Error()
		} else {
			if err := filter.SaveInstalledFilters(filters); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	case "get-workshop-filters":
		filters, err := filter.GetWorkshopFilters()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.Result = map[string]interface{}{"success": true, "filters": filters}
		}
	case "save-workshop-filters":
		var filters config.FilterConfig
		if err := json.Unmarshal(request.Params, &filters); err != nil {
			response.Error = err.Error()
		} else {
			if err := filter.SaveWorkshopFilters(filters); err != nil {
				response.Error = err.Error()
			} else {
				response.Result = map[string]bool{"success": true}
			}
		}
	}

	return response
}
