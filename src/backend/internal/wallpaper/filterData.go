package wallpaper

import (
	"linux-wallpaperengine-gui/src/backend/internal/config"
)

func GetInstalledFilters() (*config.FilterConfig, error) {
	conf, err := config.ReadConfig()
	if err != nil {
		return nil, err
	}

	if conf.InstalledFilters == nil {
		return &config.FilterConfig{
			CategoryTags:   make(map[string]bool),
			RatingTags:     make(map[string]bool),
			ResolutionTags: make(map[string]bool),
			SourceTags:     make(map[string]bool),
			Tags:           make(map[string]bool),
			TypeTags:       make(map[string]bool),
			UtilityTags:    make(map[string]bool),
			Sort:           "priority",
			Descending:     true,
		}, nil
	}

	return conf.InstalledFilters, nil
}

func SaveInstalledFilters(filters config.FilterConfig) error {
	conf, err := config.ReadConfig()
	if err != nil {
		return err
	}
	conf.InstalledFilters = &filters
	return config.WriteConfig(conf)
}

func GetWorkshopFilters() (*config.FilterConfig, error) {
	conf, err := config.ReadConfig()
	if err != nil {
		return nil, err
	}

	if conf.WorkshopFilters == nil {
		return &config.FilterConfig{
			CategoryTags:   make(map[string]bool),
			RatingTags:     make(map[string]bool),
			ResolutionTags: make(map[string]bool),
			SourceTags:     make(map[string]bool),
			Tags:           make(map[string]bool),
			TypeTags:       make(map[string]bool),
			UtilityTags:    make(map[string]bool),
			Sort:           "priority",
			Descending:     true,
		}, nil
	}

	return conf.WorkshopFilters, nil
}

func SaveWorkshopFilters(filters config.FilterConfig) error {
	conf, err := config.ReadConfig()
	if err != nil {
		return err
	}
	conf.WorkshopFilters = &filters
	return config.WriteConfig(conf)
}
