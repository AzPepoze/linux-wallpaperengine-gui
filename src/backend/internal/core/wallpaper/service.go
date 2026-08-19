package wallpaper

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/platform/display"
	"linux-wallpaperengine-gui/src/backend/internal/platform/process"
)

type Service struct {
	processManager *process.Manager
	wallpapers     map[string]WallpaperData
}

func NewService(processManager *process.Manager) *Service {
	return &Service{
		processManager: processManager,
	}
}

func (service *Service) KillAllWallpapers() {
	service.processManager.KillAll()
}

func (service *Service) KillWallpaperByFolderName(folderName string) {
	service.processManager.KillByFolderName(folderName)
}

func (service *Service) ApplyWallpapers() error {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return err
	}

	availableScreens, err := display.GetScreens()
	if err != nil {
		return err
	}

	service.ensureScreensConfig(&appConfig, availableScreens)

	activeScreens := service.getActiveScreens(appConfig, availableScreens)

	desiredWallpapers := []struct {
		Screen  string
		Exec    string
		Args    []string
		Command string
	}{}

	if appConfig.SpanMode {
		var screenNames []string
		for _, screen := range activeScreens {
			screenNames = append(screenNames, screen.Name)
		}
		if len(screenNames) < 2 {
			return fmt.Errorf("screen span requires at least two connected displays (found %d)", len(screenNames))
		}

		wallpaperID := ""
		if appConfig.GlobalWallpaper != nil && *appConfig.GlobalWallpaper != "" {
			wallpaperID = *appConfig.GlobalWallpaper
		} else {
			for _, screen := range activeScreens {
				if screen.Wallpaper != nil && *screen.Wallpaper != "" {
					wallpaperID = *screen.Wallpaper
					break
				}
			}
		}

		if wallpaperID != "" {
			execPath, args, cmdStr := service.buildSpanWallpaperCommand(appConfig, screenNames, wallpaperID)
			desiredWallpapers = append(desiredWallpapers, struct {
				Screen  string
				Exec    string
				Args    []string
				Command string
			}{Screen: "__SPAN__", Exec: execPath, Args: args, Command: cmdStr})
		}
	} else {
		for _, screen := range activeScreens {
			wallpaperID := service.getEffectiveWallpaperID(appConfig, screen)
			if wallpaperID == "" {
				continue
			}

			execPath, args, cmdStr := service.buildWallpaperCommand(appConfig, screen.Name, wallpaperID)
			desiredWallpapers = append(desiredWallpapers, struct {
				Screen  string
				Exec    string
				Args    []string
				Command string
			}{Screen: screen.Name, Exec: execPath, Args: args, Command: cmdStr})
		}
	}

	service.processManager.UpdateWallpapers(desiredWallpapers)

	if appConfig.HookEnabled && appConfig.WallpaperChangeCommand != "" {
		if service.wallpapers == nil {
			service.wallpapers, _ = GetWallpapers()
		}

		if appConfig.SpanMode {
			var screenNames []string
			for _, screen := range activeScreens {
				screenNames = append(screenNames, screen.Name)
			}
			spanScreenNames := strings.Join(screenNames, ",")
			wallpaperID := ""
			if appConfig.GlobalWallpaper != nil && *appConfig.GlobalWallpaper != "" {
				wallpaperID = *appConfig.GlobalWallpaper
			} else if len(activeScreens) > 0 && activeScreens[0].Wallpaper != nil {
				wallpaperID = *activeScreens[0].Wallpaper
			}

			if wallpaperID != "" {
				if wd, ok := service.wallpapers[wallpaperID]; ok && wd.ProjectData != nil && wd.ProjectData.Preview != "" {
					pd := wd.ProjectData
					previewPath := filepath.Join(config.WorkshopPath, wallpaperID, pd.Preview)
					var videoPath string
					isVideo := "false"
					if pd.Type == "Video" && pd.File != "" {
						videoPath = filepath.Join(config.WorkshopPath, wallpaperID, pd.File)
						isVideo = "true"
					}

					cmd := appConfig.WallpaperChangeCommand
					cmd = strings.ReplaceAll(cmd, "$PREVIEW_PATH", previewPath)
					cmd = strings.ReplaceAll(cmd, "$VIDEO_PATH", videoPath)
					cmd = strings.ReplaceAll(cmd, "$IS_VIDEO", isVideo)
					cmd = strings.ReplaceAll(cmd, "$WALLPAPER_TITLE", pd.Title)
					cmd = strings.ReplaceAll(cmd, "$WALLPAPER_TYPE", pd.Type)
					cmd = strings.ReplaceAll(cmd, "$WALLPAPER_ID", wallpaperID)
					cmd = strings.ReplaceAll(cmd, "$SCREEN_NAME", spanScreenNames)
					logger.Printf("Running hook command for span wallpaper %s on %s: %s", wallpaperID, spanScreenNames, cmd)

					go service.runHookCommand(cmd, wallpaperID, spanScreenNames)
				}
			}
		} else {
			for _, screen := range activeScreens {
				wallpaperID := service.getEffectiveWallpaperID(appConfig, screen)
				if wallpaperID == "" {
					continue
				}

				wd, ok := service.wallpapers[wallpaperID]
				if !ok || wd.ProjectData == nil || wd.ProjectData.Preview == "" {
					continue
				}
				pd := wd.ProjectData

				previewPath := filepath.Join(config.WorkshopPath, wallpaperID, pd.Preview)
				var videoPath string
				isVideo := "false"
				if pd.Type == "Video" && pd.File != "" {
					videoPath = filepath.Join(config.WorkshopPath, wallpaperID, pd.File)
					isVideo = "true"
				}

				cmd := appConfig.WallpaperChangeCommand
				cmd = strings.ReplaceAll(cmd, "$PREVIEW_PATH", previewPath)
				cmd = strings.ReplaceAll(cmd, "$VIDEO_PATH", videoPath)
				cmd = strings.ReplaceAll(cmd, "$IS_VIDEO", isVideo)
				cmd = strings.ReplaceAll(cmd, "$WALLPAPER_TITLE", pd.Title)
				cmd = strings.ReplaceAll(cmd, "$WALLPAPER_TYPE", pd.Type)
				cmd = strings.ReplaceAll(cmd, "$WALLPAPER_ID", wallpaperID)
				cmd = strings.ReplaceAll(cmd, "$SCREEN_NAME", screen.Name)
				logger.Printf("Running hook command for %s on %s: %s", wallpaperID, screen.Name, cmd)

				go service.runHookCommand(cmd, wallpaperID, screen.Name)
			}
		}
	}

	return nil
}

func (service *Service) runHookCommand(cmd, id, screenName string) {
	parts := strings.Fields(cmd)
	if len(parts) == 0 {
		logger.Printf("hook command empty for %s on %s", id, screenName)
		return
	}
	execPath := parts[0]
	args := parts[1:]
	out, err := exec.Command(execPath, args...).CombinedOutput()
	if err != nil {
		logger.Printf("hook command failed for %s on %s: %v\n%s", id, screenName, err, string(out))
	} else {
		logger.Printf("hook command succeeded for %s on %s\n%s", id, screenName, string(out))
	}
}

func (service *Service) ensureScreensConfig(appConfig *config.AppConfig, availableScreens []string) {
	var fallbackWallpaper *string
	for _, screen := range appConfig.Screens {
		if screen.Wallpaper != nil {
			fallbackWallpaper = screen.Wallpaper
			break
		}
	}

	existingScreens := make(map[string]bool)
	for _, screen := range appConfig.Screens {
		existingScreens[screen.Name] = true
	}

	configChanged := false
	for _, screenName := range availableScreens {
		if !existingScreens[screenName] {
			newScreen := config.ScreenConfig{Name: screenName}
			if fallbackWallpaper != nil {
				newScreen.Wallpaper = fallbackWallpaper
				logger.Printf("Auto-assigning wallpaper to new screen %s: %s", screenName, *fallbackWallpaper)
			}
			appConfig.Screens = append(appConfig.Screens, newScreen)
			configChanged = true
		}
	}

	if configChanged {
		if err := config.WriteConfig(*appConfig); err != nil {
			logger.Printf("Failed to update config with new screens: %v", err)
		}
	}
}

func (service *Service) getActiveScreens(appConfig config.AppConfig, availableScreens []string) []config.ScreenConfig {
	var activeScreens []config.ScreenConfig
	connectedScreensInConfig := make(map[string]config.ScreenConfig)
	for _, screen := range appConfig.Screens {
		connectedScreensInConfig[screen.Name] = screen
	}

	for _, screenName := range availableScreens {
		if screen, ok := connectedScreensInConfig[screenName]; ok {
			activeScreens = append(activeScreens, screen)
		}
	}
	return activeScreens
}

func (service *Service) getEffectiveWallpaperID(appConfig config.AppConfig, screen config.ScreenConfig) string {
	if appConfig.CloneMode && appConfig.GlobalWallpaper != nil {
		return *appConfig.GlobalWallpaper
	}
	if screen.Wallpaper != nil {
		return *screen.Wallpaper
	}
	return ""
}

func (service *Service) buildSpanWallpaperCommand(appConfig config.AppConfig, screenNames []string, wallpaperID string) (string, []string, string) {
	screenSpanArg := strings.Join(screenNames, ",")
	return service.buildWallpaperCommandInternal(appConfig, []string{"--screen-span", screenSpanArg}, wallpaperID)
}

func (service *Service) buildWallpaperCommand(appConfig config.AppConfig, screenName string, wallpaperID string) (string, []string, string) {
	return service.buildWallpaperCommandInternal(appConfig, []string{"-r", screenName}, wallpaperID)
}

func (service *Service) buildWallpaperCommandInternal(appConfig config.AppConfig, screenArgs []string, wallpaperID string) (string, []string, string) {
	fps := appConfig.FPS
	if fps == 0 {
		fps = 60
	}

	executable := appConfig.CustomExecutableLocation
	if executable == "" {
		executable = "linux-wallpaperengine"
	}

	wallpaperPath := wallpaperID
	if config.WorkshopPath != "" {
		wallpaperPath = filepath.Join(config.WorkshopPath, wallpaperID)
	}

	// Build arguments as a slice to avoid shell interpolation
	arguments := append([]string{wallpaperPath}, screenArgs...)
	arguments = append(arguments, "-f", strconv.Itoa(fps))

	if appConfig.Silence {
		arguments = append(arguments, "-s")
	} else if appConfig.Volume != nil {
		arguments = append(arguments, "--volume", strconv.Itoa(int(*appConfig.Volume)))
	}

	if appConfig.NoAutomute {
		arguments = append(arguments, "--noautomute")
	}
	if appConfig.NoAudioProcessing {
		arguments = append(arguments, "--no-audio-processing")
	}
	if appConfig.Scaling != "" {
		arguments = append(arguments, "--scaling", appConfig.Scaling)
	}
	if appConfig.Clamping != "" {
		arguments = append(arguments, "--clamp", appConfig.Clamping)
	}
	if appConfig.Layer != "" {
		arguments = append(arguments, "--layer", appConfig.Layer)
	}
	if appConfig.DisableMouse {
		arguments = append(arguments, "--disable-mouse")
	}
	if appConfig.DisableParallax {
		arguments = append(arguments, "--disable-parallax")
	}
	if appConfig.NoFullscreenPause {
		arguments = append(arguments, "--no-fullscreen-pause")
	}
	if appConfig.DisableParticles {
		arguments = append(arguments, "--disable-particles")
	}
	if appConfig.FullscreenPauseOnlyActive {
		arguments = append(arguments, "--fullscreen-pause-only-active")
	}

	for _, applicationID := range appConfig.FullscreenPauseIgnoreAppIds {
		arguments = append(arguments, "--fullscreen-pause-ignore-appid", applicationID)
	}

	if appConfig.Screenshot != "" {
		arguments = append(arguments, "--screenshot", appConfig.Screenshot)

		if appConfig.ScreenshotDelay != 0 {
			arguments = append(arguments, "--screenshot-delay", strconv.Itoa(appConfig.ScreenshotDelay))
		}
	}

	if appConfig.WallpaperEngineDir != "" {
		arguments = append(arguments, "--assets-dir", appConfig.WallpaperEngineDir+"/assets")
	} else if config.WallpaperEnginePath != "" {
		arguments = append(arguments, "--assets-dir", config.WallpaperEnginePath+"/assets")
	}

	if appConfig.DumpStructure {
		arguments = append(arguments, "--dump-structure")
	}

	// Properties
	properties, ok := appConfig.WallpaperProperties[wallpaperID]
	if !ok {
		properties = appConfig.Properties
	}

	for key, value := range properties {
		arguments = append(arguments, "--set-property", fmt.Sprintf("%s=%s", key, value))
	}

	// Parse custom args using simple whitespace splitting. Note: quoted args not fully supported.
	if appConfig.CustomArgsEnabled && appConfig.CustomArgs != "" {
		customParts := strings.Fields(appConfig.CustomArgs)
		arguments = append(arguments, customParts...)
	}

	cmdStr := fmt.Sprintf("%s %s", executable, strings.Join(arguments, " "))
	return executable, arguments, cmdStr
}

func (service *Service) LoadWallpapers() (map[string]interface{}, error) {
	wallpapers, err := GetWallpapers()
	if err != nil {
		return nil, err
	}
	service.wallpapers = wallpapers

	appConfig, _ := config.GetConfig()
	workshopPathValid := false
	if config.WorkshopPath != "" {
		if _, err := os.Stat(config.WorkshopPath); err == nil {
			workshopPathValid = true
		}
	}

	wallpaperEnginePathValid := false
	if config.WallpaperEnginePath != "" {
		if _, err := os.Stat(config.WallpaperEnginePath); err == nil {
			wallpaperEnginePathValid = true
		}
	}

	availableScreens, _ := display.GetScreens()
	connectedSet := make(map[string]bool)
	for _, screenName := range availableScreens {
		connectedSet[screenName] = true
	}

	var initialWallpaper interface{}
	if (appConfig.SpanMode || appConfig.CloneMode) && appConfig.GlobalWallpaper != nil {
		if data, ok := wallpapers[*appConfig.GlobalWallpaper]; ok {
			initialWallpaper = map[string]interface{}{
				"projectData": data.ProjectData,
				"previewPath": data.PreviewPath,
				"folderName":  *appConfig.GlobalWallpaper,
			}
		}
	}

	if initialWallpaper == nil {
		for _, screen := range appConfig.Screens {
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
	}

	if err := service.ApplyWallpapers(); err != nil {
		logger.Printf("Failed to apply wallpapers in LoadWallpapers: %v", err)
	}

	return map[string]interface{}{
		"wallpapers":               wallpapers,
		"selectedWallpaper":        initialWallpaper,
		"workshopPathValid":        workshopPathValid,
		"wallpaperEnginePathValid": wallpaperEnginePathValid,
	}, nil
}

func (service *Service) TakeScreenshot(wallpaperID string, outputPath string, delay int) error {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return err
	}

	executable := appConfig.CustomExecutableLocation
	if executable == "" {
		executable = "linux-wallpaperengine"
	}

	wallpaperPath := wallpaperID
	if config.WorkshopPath != "" {
		wallpaperPath = filepath.Join(config.WorkshopPath, wallpaperID)
	}

	if delay <= 0 {
		delay = 5
	}

	args := []string{
		wallpaperPath,
		"--screenshot", outputPath,
		"--screenshot-delay", strconv.Itoa(delay),
		"-s",
	}

	if appConfig.WallpaperEngineDir != "" {
		args = append(args, "--assets-dir", appConfig.WallpaperEngineDir+"/assets")
	} else if config.WallpaperEnginePath != "" {
		args = append(args, "--assets-dir", config.WallpaperEnginePath+"/assets")
	}

	// Properties
	properties, ok := appConfig.WallpaperProperties[wallpaperID]
	if !ok {
		properties = appConfig.Properties
	}
	for key, value := range properties {
		args = append(args, "--set-property", fmt.Sprintf("%s=%s", key, value))
	}

	cmd := exec.Command(executable, args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		logger.Printf("TakeScreenshot failed: %v, output: %s", err, string(out))
		return fmt.Errorf("screenshot failed: %w (output: %s)", err, string(out))
	}

	logger.Printf("TakeScreenshot succeeded for %s -> %s", wallpaperID, outputPath)
	return nil
}
