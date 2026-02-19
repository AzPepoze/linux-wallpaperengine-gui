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

var (
	playlistTimer     *time.Ticker
	playlistStopChan  chan bool
	playlistPauseChan chan bool
	playlistResumeChan chan bool
	playlistUpdateChan  chan int // Signal to update interval (receives new interval in minutes)
	playlistMutex     sync.Mutex
	playlistPaused    bool
	currentPlaylist   *Playlist
	playlistWallpapers []string
)

// StartPlaylistCycle starts cycling through wallpapers in the configured playlist
func StartPlaylistCycle() error {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	// Stop existing timer if any
	stopPlaylistCycleInternal()

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

	currentPlaylist = selectedPlaylist
	playlistWallpapers = extractWallpaperIDs(selectedPlaylist.Items)

	if len(playlistWallpapers) == 0 {
		return fmt.Errorf("no valid wallpapers found in playlist")
	}

	// Apply first random wallpaper immediately
	if err := applyRandomPlaylistWallpaper(conf); err != nil {
		logger.Error("Failed to apply initial playlist wallpaper: %v", err)
	}

	// If interval is 0, don't start the timer (one-time application only)
	if conf.PlaylistInterval == 0 {
		logger.Printf("Playlist interval is 0, applied single wallpaper from playlist '%s'", conf.Playlist)
		return nil
	}

	// Start the timer (interval is in minutes)
	interval := time.Duration(conf.PlaylistInterval) * time.Minute
	if interval < 1*time.Minute {
		interval = 1 * time.Minute // Minimum 1 minute
	}

	playlistTimer = time.NewTicker(interval)
	playlistStopChan = make(chan bool)
	playlistPauseChan = make(chan bool)
	playlistResumeChan = make(chan bool)
	playlistUpdateChan = make(chan int)
	playlistPaused = false

	go func() {
		for {
			select {
			case <-playlistTimer.C:
				// Only apply wallpaper if not paused
				if !playlistPaused {
					// Read config fresh each time
					currentConf, err := config.ReadConfig()
					if err != nil {
						logger.Error("Failed to read config for playlist: %v", err)
						continue
					}
					if err := applyRandomPlaylistWallpaper(currentConf); err != nil {
						logger.Error("Failed to apply playlist wallpaper: %v", err)
					}
				}
			case <-playlistPauseChan:
				playlistPaused = true
			case <-playlistResumeChan:
				playlistPaused = false
			case newIntervalMinutes := <-playlistUpdateChan:
				// Stop old ticker and create new one with updated interval
				playlistTimer.Stop()
				newInterval := time.Duration(newIntervalMinutes) * time.Minute
				if newInterval < 1*time.Minute {
					newInterval = 1 * time.Minute
				}
				playlistTimer = time.NewTicker(newInterval)
				logger.Printf("Updated playlist interval to %v", newInterval)
			case <-playlistStopChan:
				return
			}
		}
	}()

	logger.Printf("Started playlist cycle for '%s' with %d wallpapers, interval: %v", 
		conf.Playlist, len(playlistWallpapers), interval)
	return nil
}

// StopPlaylistCycle stops the playlist cycling
func StopPlaylistCycle() {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()
	stopPlaylistCycleInternal()
}

func stopPlaylistCycleInternal() {
	if playlistTimer != nil {
		playlistTimer.Stop()
		playlistTimer = nil
	}
	if playlistStopChan != nil {
		close(playlistStopChan)
		playlistStopChan = nil
	}
	if playlistPauseChan != nil {
		playlistPauseChan = nil
	}
	if playlistResumeChan != nil {
		playlistResumeChan = nil
	}
	if playlistUpdateChan != nil {
		playlistUpdateChan = nil
	}
	playlistPaused = false
	currentPlaylist = nil
	playlistWallpapers = nil
	logger.Printf("Stopped playlist cycle")
}

// PausePlaylistCycle pauses the playlist cycling (for fullscreen detection)
func PausePlaylistCycle() {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()
	
	if playlistTimer != nil && playlistPauseChan != nil && !playlistPaused {
		select {
		case playlistPauseChan <- true:
			logger.Printf("Paused playlist cycle")
		default:
			// Channel full, already paused
		}
	}
}

// ResumePlaylistCycle resumes the playlist cycling (for fullscreen detection)
func ResumePlaylistCycle() {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()
	
	if playlistTimer != nil && playlistResumeChan != nil && playlistPaused {
		select {
		case playlistResumeChan <- true:
			logger.Printf("Resumed playlist cycle")
		default:
			// Channel full, already resumed
		}
	}
}

// UpdatePlaylistInterval updates the cycling interval without changing the wallpaper
func UpdatePlaylistInterval(intervalMinutes int) error {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()
	
	// Only update if a playlist is currently running
	if playlistTimer == nil || playlistUpdateChan == nil {
		return fmt.Errorf("no playlist is currently running")
	}
	
	// Send the new interval to the goroutine
	select {
	case playlistUpdateChan <- intervalMinutes:
		logger.Printf("Sent interval update signal: %d minutes", intervalMinutes)
		return nil
	case <-time.After(1 * time.Second):
		return fmt.Errorf("timeout sending interval update")
	}
}

// extractWallpaperIDs extracts workshop IDs from playlist item paths
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

// applyRandomPlaylistWallpaper applies a random wallpaper from the current playlist
func applyRandomPlaylistWallpaper(conf config.AppConfig) error {
	if len(playlistWallpapers) == 0 {
		return fmt.Errorf("no wallpapers in playlist")
	}

	// Pick a random wallpaper
	randomIndex := rand.Intn(len(playlistWallpapers))
	wallpaperID := playlistWallpapers[randomIndex]

	// Update the configuration for each screen
	if conf.CloneMode {
		// Update global wallpaper for clone mode
		updatedConf := conf
		globalWP := wallpaperID
		updatedConf.GlobalWallpaper = &globalWP
		if err := config.WriteConfig(updatedConf); err != nil {
			return fmt.Errorf("failed to update config: %w", err)
		}
	} else {
		// Update each screen
		updatedConf := conf
		for i := range updatedConf.Screens {
			updatedConf.Screens[i].Wallpaper = &wallpaperID
		}
		if err := config.WriteConfig(updatedConf); err != nil {
			return fmt.Errorf("failed to update config: %w", err)
		}
	}

	// Apply the wallpapers
	if err := ApplyWallpapers(); err != nil {
		return fmt.Errorf("failed to apply wallpapers: %w", err)
	}

	logger.Printf("Applied random playlist wallpaper: %s", wallpaperID)
	return nil
}

// GetPlaylistStatus returns the current playlist cycling status
func GetPlaylistStatus() map[string]interface{} {
	playlistMutex.Lock()
	defer playlistMutex.Unlock()

	status := map[string]interface{}{
		"active": playlistTimer != nil,
	}

	if currentPlaylist != nil {
		status["playlist"] = currentPlaylist.Name
		status["wallpaperCount"] = len(playlistWallpapers)
	}

	return status
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
