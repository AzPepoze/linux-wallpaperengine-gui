package wallpaper

import (
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/display"
	"strings"
)

func ApplyWallpapers() error {
	conf, err := config.ReadConfig()
	if err != nil {
		return err
	}

	availableScreens, err := display.GetScreens()
	if err != nil {
		return err
	}

	screens := conf.Screens
	connectedSet := make(map[string]bool)
	for _, s := range availableScreens {
		connectedSet[s] = true
	}

	// Filter connected screens
	var activeScreens []config.ScreenConfig
	for _, s := range screens {
		if connectedSet[s.Name] {
			activeScreens = append(activeScreens, s)
		}
	}

	fps := conf.FPS
	if fps == 0 {
		fps = 60
	}

	executable := conf.CustomExecutableLocation
	if executable == "" {
		executable = "linux-wallpaperengine"
	}

	var desired []struct {
		Screen  string
		Command string
	}

	for _, screen := range activeScreens {
		targetWallpaper := ""
		if screen.Wallpaper != nil {
			targetWallpaper = *screen.Wallpaper
		}

		if conf.CloneMode && conf.GlobalWallpaper != nil {
			targetWallpaper = *conf.GlobalWallpaper
		}

		if targetWallpaper == "" {
			continue
		}

		args := []string{targetWallpaper, "-r", screen.Name, fmt.Sprintf("-f %d", fps)}

		if conf.Silence {
			args = append(args, "-s")
		} else if conf.Volume != nil {
			args = append(args, fmt.Sprintf("--volume %f", *conf.Volume))
		}

		if conf.NoAutomute {
			args = append(args, "--noautomute")
		}
		if conf.NoAudioProcessing {
			args = append(args, "--no-audio-processing")
		}
		if conf.Scaling != "" {
			args = append(args, fmt.Sprintf("--scaling %s", conf.Scaling))
		}
		if conf.Clamping != "" {
			args = append(args, fmt.Sprintf("--clamp %s", conf.Clamping))
		}
		if conf.DisableMouse {
			args = append(args, "--disable-mouse")
		}
		if conf.DisableParallax {
			args = append(args, "--disable-parallax")
		}
		if conf.NoFullscreenPause {
			args = append(args, "--no-fullscreen-pause")
		}
		if conf.DisableParticles {
			args = append(args, "--disable-particles")
		}
		if conf.FullscreenPauseOnlyActive {
			args = append(args, "--fullscreen-pause-only-active")
		}

		for _, id := range conf.FullscreenPauseIgnoreAppIds {
			args = append(args, fmt.Sprintf("--fullscreen-pause-ignore-appid %s", id))
		}

		if conf.Screenshot != "" {
			args = append(args, fmt.Sprintf("--screenshot \"%s\"", conf.Screenshot))
		}
		if conf.ScreenshotDelay != 0 {
			args = append(args, fmt.Sprintf("--screenshot-delay %d", conf.ScreenshotDelay))
		}
		if conf.AssetsDir != "" {
			args = append(args, fmt.Sprintf("--assets-dir \"%s\"", conf.AssetsDir))
		}
		if conf.DumpStructure {
			args = append(args, "--dump-structure")
		}

		for _, p := range conf.Playlist {
			args = append(args, fmt.Sprintf("--playlist \"%s\"", p))
		}

		// Properties
		props, ok := conf.WallpaperProperties[targetWallpaper]
		if !ok {
			props = conf.Properties
		}

		for k, v := range props {
			args = append(args, fmt.Sprintf("--set-property %s=\"%s\"", k, v))
		}

		if conf.CustomArgsEnabled && conf.CustomArgs != "" {
			args = append(args, conf.CustomArgs)
		}

		fullCommand := fmt.Sprintf("%s %s", executable, strings.Join(args, " "))
		desired = append(desired, struct {
			Screen  string
			Command string
		}{Screen: screen.Name, Command: fullCommand})
	}

	UpdateWallpapers(desired)
	return nil
}

func LoadWallpapers() (map[string]interface{}, error) {
	wallpapers, err := GetWallpapers()
	if err != nil {
		return nil, err
	}

	conf, _ := config.GetConfig()
	availableScreens, _ := display.GetScreens()
	connectedSet := make(map[string]bool)
	for _, s := range availableScreens {
		connectedSet[s] = true
	}

	var initialWallpaper interface{}
	for _, screen := range conf.Screens {
		if connectedSet[screen.Name] && screen.Wallpaper != nil {
			if data, ok := wallpapers[*screen.Wallpaper]; ok {
				initialWallpaper = map[string]interface{}{
					"projectData": data.ProjectData,
					"previewPath": data.PreviewPath,
					"folderName":  *screen.Wallpaper,
				}
			break
			}
		}
	}

	ApplyWallpapers()

	return map[string]interface{}{
		"wallpapers":        wallpapers,
		"selectedWallpaper": initialWallpaper,
	},
	nil
}

func KillAllWallpapers() {
	KillAll()
}