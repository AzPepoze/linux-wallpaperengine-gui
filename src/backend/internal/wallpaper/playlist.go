package wallpaper

import (
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"math/rand"
	"regexp"
	"sync"
	"time"
)

type PlaylistSession struct {
	Timer      *time.Ticker
	StopChan   chan bool
	PauseChan  chan bool
	ResumeChan chan bool
	UpdateChan chan float64
	Paused     bool
	Playlist   *Playlist
	Wallpapers []string
}

var (
	activePlaylistSessions = make(map[string]*PlaylistSession)
	playlistMutex          sync.Mutex
)

// StartPlaylistCycle starts cycling wallpapers for a screen.
func StartPlaylistCycle(screenName string) error {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	// Stop existing timer for this screen if any
	stopPlaylistCycleInternal(screenName)

	conf, err := config.ReadConfig()
	if err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	if conf.Playlist == "" {
		return fmt.Errorf("no playlist configured")
	}

	// Get all playlists
	playlists, err := GetPlaylists()
	if err != nil {
		return fmt.Errorf("failed to get playlists: %w", err)
	}

	// Find the selected playlist
	var selectedPlaylist *Playlist
	for i := range playlists {
		if playlists[i].Name == conf.Playlist {
			selectedPlaylist = &playlists[i]
			break
		}
	}

	if selectedPlaylist == nil {
		return fmt.Errorf("playlist '%s' not found", conf.Playlist)
	}

	if len(selectedPlaylist.Items) == 0 {
		return fmt.Errorf("playlist '%s' has no wallpapers", conf.Playlist)
	}

	session := &PlaylistSession{
		Playlist:   selectedPlaylist,
		Wallpapers: extractWallpaperIDs(selectedPlaylist.Items),
	}

	if len(session.Wallpapers) == 0 {
		return fmt.Errorf("no valid wallpapers found in playlist")
	}

	// Apply first random wallpaper immediately
	if err := applyRandomPlaylistWallpaper(conf, session, screenName); err != nil {
		logger.Error("Failed to apply initial playlist wallpaper: %v", err)
	}

	// If interval is 0, don't start the timer (one-time application only)
	if selectedPlaylist.Settings.Delay == 0 {
		logger.Printf("Playlist delay is 0, applied single wallpaper from playlist '%s'", conf.Playlist)
		return nil
	}

	// Start the timer (delay is in seconds)
	interval := time.Duration(selectedPlaylist.Settings.Delay) * time.Second
	if interval < 1*time.Minute {
		interval = 1 * time.Minute // Minimum 1 minute
	}

	session.Timer = time.NewTicker(interval)
	session.StopChan = make(chan bool)
	session.PauseChan = make(chan bool)
	session.ResumeChan = make(chan bool)
	session.UpdateChan = make(chan float64)
	session.Paused = false

	activePlaylistSessions[screenName] = session

	go func() {
		for {
			select {
			case <-session.Timer.C:
				// Only apply wallpaper if not paused
				if !session.Paused {
					// Read config fresh each time
					currentConf, err := config.ReadConfig()
					if err != nil {
						logger.Error("Failed to read config for playlist on screen %s: %v", screenName, err)
						continue
					}
					if err := applyRandomPlaylistWallpaper(currentConf, session, screenName); err != nil {
						logger.Error("Failed to apply playlist wallpaper on screen %s: %v", screenName, err)
					}
				}
			case <-session.PauseChan:
				session.Paused = true
			case <-session.ResumeChan:
				session.Paused = false
			case newIntervalMinutes := <-session.UpdateChan:
				// Stop old ticker and create new one with updated interval
				session.Timer.Stop()
				newInterval := time.Duration(newIntervalMinutes * float64(time.Minute))
				if newInterval < 1*time.Minute {
					newInterval = 1 * time.Minute
				}
				session.Timer = time.NewTicker(newInterval)
				logger.Printf("Updated playlist interval for screen %s to %v", screenName, newInterval)
			case <-session.StopChan:
				return
			}
		}
	}()

	logger.Printf("Started playlist cycle for screen '%s' with playlist '%s' (%d wallpapers), interval: %v",
		screenName, conf.Playlist, len(session.Wallpapers), interval)
	return nil
}

// StopPlaylistCycle stops cycling for a screen.
func StopPlaylistCycle(screenName string) {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()
	stopPlaylistCycleInternal(screenName)
}

func stopPlaylistCycleInternal(screenName string) {
	session, exists := activePlaylistSessions[screenName]
	if !exists {
		return
	}

	if session.Timer != nil {
		session.Timer.Stop()
	}
	if session.StopChan != nil {
		close(session.StopChan)
	}
	delete(activePlaylistSessions, screenName)
	logger.Printf("Stopped playlist cycle for screen '%s'", screenName)
}

// PausePlaylistCycle pauses all cycling.
func PausePlaylistCycle() {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	for _, session := range activePlaylistSessions {
		if session.Timer != nil && session.PauseChan != nil && !session.Paused {
			select {
			case session.PauseChan <- true:
				logger.Printf("Paused playlist cycle")
			default:
				// Channel full, already paused
			}
		}
	}
}

// ResumePlaylistCycle resumes all cycling.
func ResumePlaylistCycle() {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	for _, session := range activePlaylistSessions {
		if session.Timer != nil && session.ResumeChan != nil && session.Paused {
			select {
			case session.ResumeChan <- true:
				logger.Printf("Resumed playlist cycle")
			default:
				// Channel full, already resumed
			}
		}
	}
}

// UpdatePlaylistInterval updates the interval without changing wallpaper.
func UpdatePlaylistInterval(screenName string, intervalMinutes float64) error {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	session, exists := activePlaylistSessions[screenName]
	if !exists || session.Timer == nil || session.UpdateChan == nil {
		return fmt.Errorf("no playlist is currently running for screen %s", screenName)
	}

	// Send the new interval to the goroutine
	select {
	case session.UpdateChan <- intervalMinutes:
		logger.Printf("Sent interval update signal to screen %s: %f minutes", screenName, intervalMinutes)
		return nil
	case <-time.After(1 * time.Second):
		return fmt.Errorf("timeout sending interval update to screen %s", screenName)
	}
}

// extractWallpaperIDs gets IDs from playlist paths.
func extractWallpaperIDs(items []string) []string {
	var ids []string
	re := regexp.MustCompile(`431960[/\\](\d+)[/\\]`)

	for _, item := range items {
		matches := re.FindStringSubmatch(item)
		if len(matches) > 1 {
			ids = append(ids, matches[1])
		}
	}

	return ids
}

// applyRandomPlaylistWallpaper picks and applies a random wallpaper.
func applyRandomPlaylistWallpaper(conf config.AppConfig, session *PlaylistSession, screenName string) error {
	if len(session.Wallpapers) == 0 {
		return fmt.Errorf("no wallpapers in playlist")
	}

	// Pick a random wallpaper
	randomIndex := rand.Intn(len(session.Wallpapers))
	wallpaperID := session.Wallpapers[randomIndex]

	// Update the configuration for the specific screen or global (Clone Mode)
	updatedConf := conf
	if screenName == "Global" {
		// Update global wallpaper for clone mode
		globalWP := wallpaperID
		updatedConf.GlobalWallpaper = &globalWP
	} else {
		// Find and update the specific screen
		screenUpdated := false
		for i := range updatedConf.Screens {
			if updatedConf.Screens[i].Name == screenName {
				updatedConf.Screens[i].Wallpaper = &wallpaperID
				// Synchronize screen-specific playlist settings
				if session.Playlist != nil {
					updatedConf.Screens[i].Playlist = session.Playlist.Name
					updatedConf.Screens[i].PlaylistInterval = float64(session.Playlist.Settings.Delay) / 60.0
				}
				screenUpdated = true
				break
			}
		}
		if !screenUpdated {
			return fmt.Errorf("screen '%s' not found in config", screenName)
		}
	}

	if err := config.WriteConfig(updatedConf); err != nil {
		return fmt.Errorf("failed to update config: %w", err)
	}

	// Apply the wallpapers
	if err := ApplyWallpapers(); err != nil {
		return fmt.Errorf("failed to apply wallpapers: %w", err)
	}

	logger.Printf("Applied random playlist wallpaper '%s' to screen '%s'", wallpaperID, screenName)
	return nil
}

// GetPlaylistStatus returns status for all screens.
func GetPlaylistStatus() map[string]interface{} {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	status := make(map[string]interface{})

	for screenName, session := range activePlaylistSessions {
		screenStatus := map[string]interface{}{
			"active": session.Timer != nil,
		}
		if session.Playlist != nil {
			screenStatus["playlist"] = session.Playlist.Name
			screenStatus["wallpaperCount"] = len(session.Wallpapers)
		}
		status[screenName] = screenStatus
	}

	// If no sessions exist, at least return an empty status object to signify inactive
	if len(status) == 0 {
		return map[string]interface{}{}
	}

	return status
}
