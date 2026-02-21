package handlers

import (
	"encoding/json"
	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/electron"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os"
	"time"
)

func HandleSystem(req models.Request, encoder *json.Encoder, cleanup func()) models.Response {
	var res models.Response
	res.ID = req.ID

	switch req.Method {
	case "ping":
		res.Result = "pong"
	case "quit":
		res.Result = "ok"
		if err := encoder.Encode(res); err != nil {
			logger.Println("Encode error during quit:", err)
		}
		time.Sleep(100 * time.Millisecond)
		cleanup()
		os.Exit(0)
	case "open-ui":
		if !electron.IsRunning() {
			go electron.Start()
			res.Result = map[string]string{"status": "starting"}
		} else {
			res.Result = map[string]string{"status": "already_running"}
		}
	case "restart-ui":
		res.Result = "ok"
		if err := encoder.Encode(res); err != nil {
			logger.Println("Encode error during restart-ui:", err)
		}
		go func() {
			// Give the frontend time to exit gracefully, or kill it if it doesn't
			time.Sleep(500 * time.Millisecond)
			electron.Stop()
			time.Sleep(500 * time.Millisecond)
			electron.Start()
		}()
	}

	return res
}
