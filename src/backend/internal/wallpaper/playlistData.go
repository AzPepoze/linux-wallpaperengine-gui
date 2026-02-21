package wallpaper

import (
	"encoding/json"
	"fmt"
	"os"
)

func GetPlaylists() ([]Playlist, error) {
	configPath, err := GetWEConfigPath()
	if err != nil {
		return nil, err
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("wallpaper_engine config.json not found at %s", configPath)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config.json: %w", err)
	}

	var weConfig WallpaperEngineConfig
	if err := json.Unmarshal(data, &weConfig); err != nil {
		return nil, fmt.Errorf("failed to parse config.json: %w", err)
	}

	return weConfig.SteamUser.General.Playlists, nil
}

func CreatePlaylist(name string) error {
	playlists, err := GetPlaylists()
	if err != nil {
		return err
	}
	playlists = append(playlists, Playlist{
		Name:  name,
		Items: []string{},
		Settings: PlaylistSettings{
			Delay:         60,
			Mode:          "timer",
			Order:         "random",
			Transition:    false,
			UpdateOnPause: false,
			VideoSequence: false,
		},
	})
	return SavePlaylists(playlists)
}

func RenamePlaylist(oldName, newName string) error {
	playlists, err := GetPlaylists()
	if err != nil {
		return err
	}
	for i := range playlists {
		if playlists[i].Name == oldName {
			playlists[i].Name = newName
			break
		}
	}
	return SavePlaylists(playlists)
}

func DeletePlaylist(name string) error {
	playlists, err := GetPlaylists()
	if err != nil {
		return err
	}
	newPlaylists := []Playlist{}
	for _, p := range playlists {
		if p.Name != name {
			newPlaylists = append(newPlaylists, p)
		}
	}
	return SavePlaylists(newPlaylists)
}

func UpdatePlaylistItems(name string, items []string) error {
	playlists, err := GetPlaylists()
	if err != nil {
		return err
	}
	for i := range playlists {
		if playlists[i].Name == name {
			playlists[i].Items = items
			break
		}
	}
	return SavePlaylists(playlists)
}

func UpdatePlaylistIntervalConfig(name string, intervalMinutes float64) error {
	playlists, err := GetPlaylists()
	if err != nil {
		return err
	}
	for i := range playlists {
		if playlists[i].Name == name {
			playlists[i].Settings.Delay = int(intervalMinutes * 60)
			break
		}
	}
	return SavePlaylists(playlists)
}

func SavePlaylists(playlists []Playlist) error {
	configPath, err := GetWEConfigPath()
	if err != nil {
		return err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read config.json: %w", err)
	}

	// Unmarshal into generic map to preserve all other fields
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

	// Convert playlists slice into what json.Unmarshal would produce
	// for generic map[string]interface{} so we can seamlessly insert it
	pBytes, err := json.Marshal(playlists)
	if err != nil {
		return fmt.Errorf("failed to marshal playlists: %w", err)
	}

	var genericPlaylists interface{}
	if err := json.Unmarshal(pBytes, &genericPlaylists); err != nil {
		return fmt.Errorf("failed to prepare playlists for save: %w", err)
	}

	general["playlists"] = genericPlaylists

	// Marshal back with indentation matching WE
	newData, err := json.MarshalIndent(root, "", "\t")
	if err != nil {
		return fmt.Errorf("failed to marshal config.json: %w", err)
	}

	return os.WriteFile(configPath, newData, 0644)
}
