package wallpaper

import (
	"encoding/json"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"os"
	"path/filepath"
	"strings"
)

func GetWallpapers() (map[string]WallpaperData, error) {
	err := config.EnsureInitialized()
	if err != nil {
		return nil, err
	}

	basePath := config.WallpaperPath
	entries, err := os.ReadDir(basePath)
	if err != nil {
		return nil, err
	}

	wallpapers := make(map[string]WallpaperData)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		folderName := entry.Name()
		projectJsonPath := filepath.Join(basePath, folderName, "project.json")

		data, err := os.ReadFile(projectJsonPath)
		if err != nil {
			continue
		}

		var projectData WallpaperProjectData
		if err := json.Unmarshal(data, &projectData); err != nil {
			continue
		}

		var previewPath string
		if projectData.Preview != "" {
			previewPath = fmt.Sprintf("wallpaper://%s", filepath.Join(basePath, folderName, projectData.Preview))
		}

		wallpapers[folderName] = WallpaperData{
			ProjectData: &projectData,
			PreviewPath: previewPath,
		}
	}

	return wallpapers, nil
}

func GetWallpaperProjectData(folderName string) (map[string]interface{}, error) {
	err := config.EnsureInitialized()
	if err != nil {
		return nil, err
	}

	projectJsonPath := filepath.Join(config.WallpaperPath, folderName, "project.json")
	data, err := os.ReadFile(projectJsonPath)
	if err != nil {
		return nil, err
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}

	properties := make(map[string]interface{})
	if gen, ok := raw["general"].(map[string]interface{}); ok {
		if props, ok := gen["properties"].(map[string]interface{}); ok {
			properties = props
		}
	} else if props, ok := raw["properties"].(map[string]interface{}); ok {
		properties = props
	}

	if scheme, ok := raw["schemecolor"].(string); ok {
		if _, exists := properties["schemecolor"]; !exists {
			properties["schemecolor"] = map[string]interface{}{
				"type":  "color",
				"text":  "Theme Color",
				"value": scheme,
				"order": -1,
			}
		}
	}

	return properties, nil
}
func GetPlaylists() ([]Playlist, error) {
	err := config.EnsureInitialized()
	if err != nil {
		return nil, err
	}

	// Find the wallpaper_engine installation directory
	// The workshop content is at ~/.../steamapps/workshop/content/431960
	// The installation is at ~/.../steamapps/common/wallpaper_engine
	workshopPath := config.WallpaperPath
	if workshopPath == "" {
		return nil, fmt.Errorf("wallpaper path not initialized")
	}

	// Convert workshop path to common path
	// From: ...steamapps/workshop/content/431960
	// To:   ...steamapps/common/wallpaper_engine
	installPath := ""
	if strings.Contains(workshopPath, "steamapps/workshop/content/431960") {
		installPath = strings.Replace(workshopPath, "steamapps/workshop/content/431960", "steamapps/common/wallpaper_engine", 1)
	} else if strings.Contains(workshopPath, "steamapps\\\\workshop\\\\content\\\\431960") {
		installPath = strings.Replace(workshopPath, "steamapps\\\\workshop\\\\content\\\\431960", "steamapps\\\\common\\\\wallpaper_engine", 1)
	} else {
		return nil, fmt.Errorf("could not determine wallpaper_engine installation path")
	}

	configPath := filepath.Join(installPath, "config.json")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("wallpaper_engine config.json not found at %s", configPath)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config.json: %w", err)
	}

	var weConfig WallpaperEngineConfig
	if err := json.Unmarshal(data, &weConfig); err != nil {
		return nil, fmt.Errorf("failed to parse config.json: %w", err)
	}

	return weConfig.SteamUser.General.Playlists, nil
}
