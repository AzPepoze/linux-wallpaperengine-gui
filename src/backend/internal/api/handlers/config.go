package handlers

import (
	"encoding/json"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/config"
)

func HandleConfig(req models.Request) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
	case "get-config":
		conf, err := config.GetConfig()
		if err != nil {
			res.Error = err.Error()
		} else {
			res.Result = conf
		}
	case "write-config":
		var conf config.AppConfig
		if err := json.Unmarshal(req.Params, &conf); err != nil {
			res.Error = err.Error()
		} else {
			if err := config.WriteConfig(conf); err != nil {
				res.Error = err.Error()
			} else {
				res.Result = map[string]bool{"success": true}
			}
		}
	case "open-config-editor":
		if err := config.OpenConfigEditor(); err != nil {
			res.Error = err.Error()
		} else {
			res.Result = map[string]bool{"success": true}
		}
	}

	return res
}
