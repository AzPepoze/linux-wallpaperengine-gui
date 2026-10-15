package wallpaper

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"

	"linux-wallpaperengine-gui/src/backend/internal/config"
)

func GetWallpapers() (map[string]WallpaperData, error) {
	if err := config.EnsureInitialized(); err != nil {
		return nil, err
	}

	wallpapers := make(map[string]WallpaperData)

	if err := scanWallpaperDir(config.WorkshopPath, wallpapers); err != nil {
		return nil, err
	}

	// Built-in wallpapers never override a Workshop item with the same folder name.
	_ = scanWallpaperDir(BuiltInWallpaperDir(), wallpapers)

	return wallpapers, nil
}

// BuiltInWallpaperDir returns the folder holding the wallpapers bundled with Wallpaper Engine.
func BuiltInWallpaperDir() string {
	if config.WallpaperEnginePath == "" {
		return ""
	}
	return filepath.Join(config.WallpaperEnginePath, "projects", "defaultprojects")
}

// ResolveWallpaperDir returns the folder of a wallpaper, checking Workshop first, then built-in.
func ResolveWallpaperDir(folderName string) string {
	workshopDir := filepath.Join(config.WorkshopPath, folderName)
	if isWallpaperDir(workshopDir) {
		return workshopDir
	}

	if builtInDir := BuiltInWallpaperDir(); builtInDir != "" {
		builtInItemDir := filepath.Join(builtInDir, folderName)
		if isWallpaperDir(builtInItemDir) {
			return builtInItemDir
		}
	}

	return workshopDir
}

func isWallpaperDir(dir string) bool {
	_, err := os.Stat(filepath.Join(dir, "project.json"))
	return err == nil
}

// scanWallpaperDir adds every wallpaper folder under basePath to wallpapers, skipping names already present.
func scanWallpaperDir(basePath string, wallpapers map[string]WallpaperData) error {
	if basePath == "" {
		return nil
	}

	if _, err := os.Stat(basePath); os.IsNotExist(err) {
		return nil
	}

	entries, err := os.ReadDir(basePath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		folderName := entry.Name()
		if _, exists := wallpapers[folderName]; exists {
			continue
		}

		data, err := os.ReadFile(filepath.Join(basePath, folderName, "project.json"))
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

		var installDate int64
		if info, err := entry.Info(); err == nil {
			if stat, ok := info.Sys().(*syscall.Stat_t); ok {
				installDate = stat.Ctim.Sec
			} else {
				installDate = info.ModTime().Unix()
			}
		}

		wallpapers[folderName] = WallpaperData{
			ProjectData: &projectData,
			PreviewPath: previewPath,
			InstallDate: installDate,
			FolderPath:  filepath.Join(basePath, folderName),
		}
	}

	return nil
}

func GetWallpaperProjectData(folderName string) (map[string]interface{}, error) {
	if err := config.EnsureInitialized(); err != nil {
		return nil, err
	}

	projectJSONPath := filepath.Join(ResolveWallpaperDir(folderName), "project.json")
	data, err := os.ReadFile(projectJSONPath)
	if err != nil {
		return nil, err
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}

	properties := make(map[string]interface{})
	if general, ok := raw["general"].(map[string]interface{}); ok {
		if props, ok := general["properties"].(map[string]interface{}); ok {
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

func GetWEConfigPath() (string, error) {
	if err := config.EnsureInitialized(); err != nil {
		return "", err
	}

	workshopPath := config.WorkshopPath
	if workshopPath == "" {
		return "", fmt.Errorf("wallpaper path not initialized")
	}

	installPath := ""
	if strings.Contains(workshopPath, "steamapps/workshop/content/431960") {
		installPath = strings.Replace(workshopPath, "steamapps/workshop/content/431960", "steamapps/common/wallpaper_engine", 1)
	} else if strings.Contains(workshopPath, "steamapps\\\\workshop\\\\content\\\\431960") {
		installPath = strings.Replace(workshopPath, "steamapps\\\\workshop\\\\content\\\\431960", "steamapps\\\\common\\\\wallpaper_engine", 1)
	} else {
		return "", fmt.Errorf("could not determine wallpaper_engine installation path")
	}

	configPath := filepath.Join(installPath, "config.json")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return "", fmt.Errorf("Wallpaper Engine configuration not found. Please run Wallpaper Engine at least once to initialize it")
	}

	return configPath, nil
}
