package config

import (
	"encoding/json"
	"strings"
)

type ScreenConfig struct {
	Name             string  `json:"name"`
	Wallpaper        *string `json:"wallpaper"`
	Playlist         string  `json:"playlist"`
	PlaylistInterval float64 `json:"playlistInterval,omitempty"`
}

type AppConfig struct {
	// --- Linux Wallpaper Engine Arguments ---
	// Performance & Basic Behavior
	FPS               int  `json:"FPS,omitempty"`
	Silence           bool `json:"SILENCE"`
	NoAutomute        bool `json:"noAutomute"`
	NoAudioProcessing bool `json:"noAudioProcessing"`
	NoFullscreenPause bool `json:"noFullscreenPause"`
	DisableParticles  bool `json:"disableParticles"`
	DumpStructure     bool `json:"dumpStructure"`

	// Display & Rendering
	Scaling          string  `json:"scaling,omitempty"`
	Clamping         string  `json:"clamping,omitempty"`
	Playlist         string  `json:"playlist"`
	PlaylistInterval float64 `json:"playlistInterval,omitempty"`

	// Audio Settings
	Volume *float64 `json:"volume,omitempty"`

	// Input & Interaction
	DisableMouse    bool `json:"disableMouse"`
	DisableParallax bool `json:"disableParallax"`

	// Fullscreen Pause Logic
	FullscreenPauseOnlyActive   bool     `json:"fullscreenPauseOnlyActive"`
	FullscreenPauseIgnoreAppIds []string `json:"fullscreenPauseIgnoreAppIds,omitempty"`

	// Wallpaper Properties
	Properties          map[string]string            `json:"properties,omitempty"`
	WallpaperProperties map[string]map[string]string `json:"wallpaperProperties,omitempty"`

	// Custom Arguments
	CustomArgs        string `json:"customArgs,omitempty"`
	CustomArgsEnabled bool   `json:"customArgsEnabled"`

	// Utilities & Paths
	Screenshot         string `json:"screenshot,omitempty"`
	ScreenshotDelay    int    `json:"screenshotDelay,omitempty"`
	WallpaperEngineDir string `json:"wallpaperEngineDir,omitempty"`

	// --- GUI / Internal Settings ---
	Screens                  []ScreenConfig `json:"screens,omitempty"`
	CloneMode                bool           `json:"cloneMode,omitempty"`
	GlobalWallpaper          *string        `json:"globalWallpaper,omitempty"`
	CustomExecutableLocation string         `json:"customExecutableLocation,omitempty"`
	WorkshopDir              string         `json:"workshopDir,omitempty"`
	NativeWayland            bool           `json:"nativeWayland,omitempty"`
	DynamicUiTheme           bool           `json:"dynamicUiTheme"`
	DynamicSidebarTheme      bool           `json:"dynamicSidebarTheme"`
	TransparentUi            bool           `json:"transparentUi"`
	UiTransparency           int            `json:"uiTransparency,omitempty"`
	SteamPaths               []string       `json:"steamPaths,omitempty"`

	// Fixed Filters
	InstalledFilters *FilterConfig `json:"installedFilters,omitempty"`
	WorkshopFilters  *FilterConfig `json:"workshopFilters,omitempty"`
}

type FilterConfig struct {
	CategoryTags   map[string]bool `json:"categorytags"`
	Descending     bool            `json:"descending"`
	RatingTags     map[string]bool `json:"ratingtags"`
	ResolutionTags map[string]bool `json:"resolutiontags"`
	Sort           string          `json:"sort"`
	SourceTags     map[string]bool `json:"sourcetags"`
	Tags           map[string]bool `json:"tags"`
	Type           string          `json:"type"`
	TypeTags       map[string]bool `json:"typetags"`
	UtilityTags    map[string]bool `json:"utilitytags"`
}

// UnmarshalJSON custom unmarshaler for FilterConfig to handle number/string to bool conversion in maps
func (fc *FilterConfig) UnmarshalJSON(data []byte) error {
	type Alias FilterConfig
	aux := &struct {
		CategoryTags   map[string]interface{} `json:"categorytags"`
		RatingTags     map[string]interface{} `json:"ratingtags"`
		ResolutionTags map[string]interface{} `json:"resolutiontags"`
		SourceTags     map[string]interface{} `json:"sourcetags"`
		Tags           map[string]interface{} `json:"tags"`
		TypeTags       map[string]interface{} `json:"typetags"`
		UtilityTags    map[string]interface{} `json:"utilitytags"`
		*Alias
	}{
		Alias: (*Alias)(fc),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Helper to convert map[string]interface{} to map[string]bool
	convertToBoolMap := func(m map[string]interface{}) map[string]bool {
		if m == nil {
			return nil
		}
		result := make(map[string]bool)
		for k, v := range m {
			result[k] = ToBool(v)
		}
		return result
	}

	fc.CategoryTags = convertToBoolMap(aux.CategoryTags)
	fc.RatingTags = convertToBoolMap(aux.RatingTags)
	fc.ResolutionTags = convertToBoolMap(aux.ResolutionTags)
	fc.SourceTags = convertToBoolMap(aux.SourceTags)
	fc.Tags = convertToBoolMap(aux.Tags)
	fc.TypeTags = convertToBoolMap(aux.TypeTags)
	fc.UtilityTags = convertToBoolMap(aux.UtilityTags)

	return nil
}

func ToBool(v interface{}) bool {
	if v == nil {
		return false
	}
	switch val := v.(type) {
	case bool:
		return val
	case string:
		return strings.ToLower(strings.TrimSpace(val)) != "false"
	case float64:
		return val != 0
	}
	return false
}
