package wallpaper

type WallpaperProjectData struct {
	Title       string                 `json:"title"`
	Description string                 `json:"description,omitempty"`
	File        string                 `json:"file"`
	Preview     string                 `json:"preview"`
	Type        string                 `json:"type"`
	Tags        []string               `json:"tags,omitempty"`
	WorkshopID  string                 `json:"workshopid,omitempty"`
	General     map[string]interface{} `json:"general,omitempty"`
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
	Clock          string `json:"clock"`
	Delay          int    `json:"delay"`
	Mode           string `json:"mode"`
	Order          string `json:"order"`
	Transition     bool   `json:"transition"`
	UpdateOnPause  bool   `json:"updateonpause"`
	VideoSequence  bool   `json:"videosequence"`
}

type Playlist struct {
	Name     string            `json:"name"`
	Items    []string          `json:"items"`
	Settings PlaylistSettings  `json:"settings"`
}

type WallpaperEngineConfig struct {
	SteamUser struct {
		General struct {
			Playlists []Playlist `json:"playlists"`
		} `json:"general"`
	} `json:"steamuser"`
}
