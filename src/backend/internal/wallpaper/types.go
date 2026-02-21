package wallpaper

import (
	"encoding/json"
	"strings"
)

type WallpaperProjectData struct {
	Title         string                 `json:"title"`
	Description   string                 `json:"description,omitempty"`
	File          string                 `json:"file"`
	Preview       string                 `json:"preview"`
	Type          string                 `json:"type"`
	Tags          []string               `json:"tags,omitempty"`
	WorkshopID    string                 `json:"workshopid,omitempty"`
	ContentRating string                 `json:"contentrating,omitempty"`
	Approved      bool                   `json:"approved,omitempty"`
	General       map[string]interface{} `json:"general,omitempty"`
}

type WallpaperData struct {
	ProjectData *WallpaperProjectData `json:"projectData"`
	PreviewPath string                `json:"previewPath,omitempty"`
}

type Wallpaper struct {
	WallpaperData
	FolderName string `json:"folderName"`
}

type PropertyType string

const (
	Slider    PropertyType = "slider"
	Boolean   PropertyType = "boolean"
	Bool      PropertyType = "bool"
	ComboList PropertyType = "combolist"
	Combo     PropertyType = "combo"
	Color     PropertyType = "color"
	Text      PropertyType = "text"
	TextInput PropertyType = "textinput"
	Group     PropertyType = "group"
	Unknown   PropertyType = "unknown"
)

type WallpaperProperty struct {
	Name        string            `json:"name"`
	Type        PropertyType      `json:"type"`
	Description string            `json:"description"`
	Value       interface{}       `json:"value"`
	Min         *float64          `json:"min,omitempty"`
	Max         *float64          `json:"max,omitempty"`
	Step        *float64          `json:"step,omitempty"`
	Options     map[string]string `json:"options,omitempty"`
}

type PlaylistSettings struct {
	Clock         string `json:"clock"`
	Delay         int    `json:"delay"`
	Mode          string `json:"mode"`
	Order         string `json:"order"`
	Transition    bool   `json:"transition"`
	UpdateOnPause bool   `json:"updateonpause"`
	VideoSequence bool   `json:"videosequence"`
}

// UnmarshalJSON custom unmarshaler for PlaylistSettings to handle string-to-bool conversion
func (ps *PlaylistSettings) UnmarshalJSON(data []byte) error {
	type Alias PlaylistSettings
	aux := &struct {
		Transition    interface{} `json:"transition"`
		UpdateOnPause interface{} `json:"updateonpause"`
		VideoSequence interface{} `json:"videosequence"`
		*Alias
	}{
		Alias: (*Alias)(ps),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	ps.Transition = toBool(aux.Transition)
	ps.UpdateOnPause = toBool(aux.UpdateOnPause)
	ps.VideoSequence = toBool(aux.VideoSequence)

	return nil
}

// toBool converts various types to bool
func toBool(v interface{}) bool {
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

type Playlist struct {
	Name     string           `json:"name"`
	Items    []string         `json:"items"`
	Settings PlaylistSettings `json:"settings"`
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
			result[k] = toBool(v)
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

type WallpaperEngineConfig struct {
	SteamUser struct {
		General struct {
			Browser struct {
				FilterInfo struct {
					Installed FilterConfig `json:"installed"`
					Workshop  FilterConfig `json:"workshop"`
				} `json:"filterinfo"`
			} `json:"browser"`
			Playlists []Playlist `json:"playlists"`
		} `json:"general"`
	} `json:"steamuser"`
}
