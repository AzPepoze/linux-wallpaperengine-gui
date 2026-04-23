package handlers

import (
	"encoding/json"
	"os"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/ui/electron"
)

func (handler *Handler) HandleSystem(request models.Request, encoder *json.Encoder) models.Response {
	var response models.Response
	response.ID = request.ID

	switch request.Method {
	case "ping":
		response.Result = "pong"
	case "quit":
		response.Result = "ok"
		if err := encoder.Encode(response); err != nil {
			logger.Println("Encode error during quit:", err)
		}
		time.Sleep(100 * time.Millisecond)
		handler.cleanupFunc()
		os.Exit(0)
	case "open-ui":
		if !electron.IsRunning() {
			go electron.Start()
			response.Result = map[string]string{"status": "starting"}
		} else {
			response.Result = map[string]string{"status": "already_running"}
		}
	case "restart-ui":
		response.Result = "ok"
		if err := encoder.Encode(response); err != nil {
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

	return response
}
