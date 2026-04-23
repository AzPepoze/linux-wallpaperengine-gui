package wallpaper

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/platform/display"
	"linux-wallpaperengine-gui/src/backend/internal/platform/process"
)

type Service struct {
	processManager *process.Manager
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
		Command string
	}{}

	for _, screen := range activeScreens {
		wallpaperID := service.getEffectiveWallpaperID(appConfig, screen)
		if wallpaperID == "" {
			continue
		}

		command := service.buildWallpaperCommand(appConfig, screen.Name, wallpaperID)
		desiredWallpapers = append(desiredWallpapers, struct {
			Screen  string
			Command string
		}{Screen: screen.Name, Command: command})
	}

	service.processManager.UpdateWallpapers(desiredWallpapers)
	return nil
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

func (service *Service) buildWallpaperCommand(appConfig config.AppConfig, screenName string, wallpaperID string) string {
	fps := appConfig.FPS
	if fps == 0 {
		fps = 60
	}

	executable := appConfig.CustomExecutableLocation
	if executable == "" {
		executable = "linux-wallpaperengine"
	}

	wallpaperPath := fmt.Sprintf("\"%s\"", wallpaperID)
	if config.WorkshopPath != "" {
		wallpaperPath = fmt.Sprintf("\"%s\"", filepath.Join(config.WorkshopPath, wallpaperID))
	}

	arguments := []string{wallpaperPath, "-r", screenName, fmt.Sprintf("-f %d", fps)}

	if appConfig.Silence {
		arguments = append(arguments, "-s")
	} else if appConfig.Volume != nil {
		arguments = append(arguments, fmt.Sprintf("--volume %d", int(*appConfig.Volume)))
	}

	if appConfig.NoAutomute {
		arguments = append(arguments, "--noautomute")
	}
	if appConfig.NoAudioProcessing {
		arguments = append(arguments, "--no-audio-processing")
	}
	if appConfig.Scaling != "" {
		arguments = append(arguments, fmt.Sprintf("--scaling %s", appConfig.Scaling))
	}
	if appConfig.Clamping != "" {
		arguments = append(arguments, fmt.Sprintf("--clamp %s", appConfig.Clamping))
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
		arguments = append(arguments, fmt.Sprintf("--fullscreen-pause-ignore-appid %s", applicationID))
	}

	if appConfig.Screenshot != "" {
		arguments = append(arguments, fmt.Sprintf("--screenshot \"%s\"", appConfig.Screenshot))

		if appConfig.ScreenshotDelay != 0 {
			arguments = append(arguments, fmt.Sprintf("--screenshot-delay %d", appConfig.ScreenshotDelay))
		}
	}

	if appConfig.WallpaperEngineDir != "" {
		arguments = append(arguments, fmt.Sprintf("--assets-dir \"%s\"", appConfig.WallpaperEngineDir+"/assets"))
	} else if config.WallpaperEnginePath != "" {
		arguments = append(arguments, fmt.Sprintf("--assets-dir \"%s\"", config.WallpaperEnginePath+"/assets"))
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
		arguments = append(arguments, fmt.Sprintf("--set-property %s=\"%s\"", key, value))
	}

	if appConfig.CustomArgsEnabled && appConfig.CustomArgs != "" {
		arguments = append(arguments, appConfig.CustomArgs)
	}

	return fmt.Sprintf("%s %s", executable, strings.Join(arguments, " "))
}

func (service *Service) LoadWallpapers() (map[string]interface{}, error) {
	wallpapers, err := GetWallpapers()
	if err != nil {
		return nil, err
	}

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


