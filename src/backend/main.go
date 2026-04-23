package main

import (
	"linux-wallpaperengine-gui/src/backend/internal/app"
)

func main() {
	options := app.ParseOptions()
	application := app.NewApp(options)
	application.Run()
}
