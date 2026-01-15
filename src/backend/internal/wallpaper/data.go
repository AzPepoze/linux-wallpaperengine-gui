package wallpaper

import (
	"encoding/json"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"os"
	"path/filepath"
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
