package wallpaper

import (
	"encoding/json"
	"fmt"
	"os"
)

func GetInstalledFilters() (*FilterConfig, error) {
	configPath, err := GetWEConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config.json: %w", err)
	}

	var weConfig WallpaperEngineConfig
	if err := json.Unmarshal(data, &weConfig); err != nil {
		return nil, fmt.Errorf("failed to parse config.json: %w", err)
	}

	return &weConfig.SteamUser.General.Browser.FilterInfo.Installed, nil
}

func SaveInstalledFilters(config FilterConfig) error {
	return saveFilters("installed", config)
}

func GetWorkshopFilters() (*FilterConfig, error) {
	configPath, err := GetWEConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config.json: %w", err)
	}

	var weConfig WallpaperEngineConfig
	if err := json.Unmarshal(data, &weConfig); err != nil {
		return nil, fmt.Errorf("failed to parse config.json: %w", err)
	}

	return &weConfig.SteamUser.General.Browser.FilterInfo.Workshop, nil
}

func SaveWorkshopFilters(config FilterConfig) error {
	return saveFilters("workshop", config)
}

func saveFilters(filterType string, filterConfig FilterConfig) error {
	configPath, err := GetWEConfigPath()
	if err != nil {
		return err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read config.json: %w", err)
	}

	var root map[string]interface{}
	if err := json.Unmarshal(data, &root); err != nil {
		return fmt.Errorf("failed to parse config.json: %w", err)
	}

	steamUser, ok := root["steamuser"].(map[string]interface{})
	if !ok {
		steamUser = make(map[string]interface{})
		root["steamuser"] = steamUser
	}

	general, ok := steamUser["general"].(map[string]interface{})
	if !ok {
		general = make(map[string]interface{})
		steamUser["general"] = general
	}

	browser, ok := general["browser"].(map[string]interface{})
	if !ok {
		browser = make(map[string]interface{})
		general["browser"] = browser
	}

	filterInfo, ok := browser["filterinfo"].(map[string]interface{})
	if !ok {
		filterInfo = make(map[string]interface{})
		browser["filterinfo"] = filterInfo
	}

	// Convert FilterConfig to generic map
	configBytes, err := json.Marshal(filterConfig)
	if err != nil {
		return fmt.Errorf("failed to marshal filter config: %w", err)
	}

	var genericConfig interface{}
	if err := json.Unmarshal(configBytes, &genericConfig); err != nil {
		return fmt.Errorf("failed to prepare filter config for save: %w", err)
	}

	filterInfo[filterType] = genericConfig

	// Marshal back with indentation matching WE
	newData, err := json.MarshalIndent(root, "", "\t")
	if err != nil {
		return fmt.Errorf("failed to marshal config.json: %w", err)
	}

	return os.WriteFile(configPath, newData, 0644)
}
