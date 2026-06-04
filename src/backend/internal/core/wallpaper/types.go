package wallpaper

import (
	"encoding/json"
	"fmt"
)

// WorkshopID is a string type that can unmarshal both JSON strings and numbers.
// Some project.json files store workshopid as a JSON number (e.g. 922746215)
// while others store it as a JSON string (e.g. "2149274797").
type WorkshopID string

func (id *WorkshopID) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err == nil {
		*id = WorkshopID(s)
		return nil
	}
	var n json.Number
	if err := json.Unmarshal(data, &n); err == nil {
		*id = WorkshopID(n.String())
		return nil
	}
	return fmt.Errorf("workshopid must be a string or number, got: %s", string(data))
}

func (id WorkshopID) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(id))
}

type WallpaperProjectData struct {
	Title         string                 `json:"title"`
	Description   string                 `json:"description,omitempty"`
	File          string                 `json:"file"`
	Preview       string                 `json:"preview"`
	Type          string                 `json:"type"`
	Tags          []string               `json:"tags,omitempty"`
	WorkshopID    WorkshopID             `json:"workshopid,omitempty"`
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
