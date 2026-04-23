package filter

import (
	"linux-wallpaperengine-gui/src/backend/internal/config"
)

func GetInstalledFilters() (*config.FilterConfig, error) {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return nil, err
	}

	if appConfig.InstalledFilters == nil {
		return config.DefaultConfig.InstalledFilters, nil
	}

	return appConfig.InstalledFilters, nil
}

func SaveInstalledFilters(filters config.FilterConfig) error {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return err
	}
	appConfig.InstalledFilters = &filters
	return config.WriteConfig(appConfig)
}

func GetWorkshopFilters() (*config.FilterConfig, error) {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return nil, err
	}

	if appConfig.WorkshopFilters == nil {
		return config.DefaultConfig.WorkshopFilters, nil
	}

	return appConfig.WorkshopFilters, nil
}

func SaveWorkshopFilters(filters config.FilterConfig) error {
	appConfig, err := config.ReadConfig()
	if err != nil {
		return err
	}
	appConfig.WorkshopFilters = &filters
	return config.WriteConfig(appConfig)
}
