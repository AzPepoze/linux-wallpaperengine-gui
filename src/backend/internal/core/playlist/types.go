package playlist

import (
	"encoding/json"
	"linux-wallpaperengine-gui/src/backend/internal/config"
)

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
func (settings *PlaylistSettings) UnmarshalJSON(data []byte) error {
	type Alias PlaylistSettings
	auxiliary := &struct {
		Transition    interface{} `json:"transition"`
		UpdateOnPause interface{} `json:"updateonpause"`
		VideoSequence interface{} `json:"videosequence"`
		*Alias
	}{
		Alias: (*Alias)(settings),
	}

	if err := json.Unmarshal(data, &auxiliary); err != nil {
		return err
	}

	settings.Transition = config.ToBool(auxiliary.Transition)
	settings.UpdateOnPause = config.ToBool(auxiliary.UpdateOnPause)
	settings.VideoSequence = config.ToBool(auxiliary.VideoSequence)

	return nil
}

type Playlist struct {
	Name     string           `json:"name"`
	Items    []string         `json:"items"`
	Settings PlaylistSettings `json:"settings"`
}

type WallpaperEngineConfig struct {
	SteamUser struct {
		General struct {
			Browser struct {
				FilterInfo struct {
					Installed config.FilterConfig `json:"installed"`
					Workshop  config.FilterConfig `json:"workshop"`
				} `json:"filterinfo"`
			} `json:"browser"`
			Playlists []Playlist `json:"playlists"`
		} `json:"general"`
	} `json:"steamuser"`
}
