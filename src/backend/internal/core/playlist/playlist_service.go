package playlist

import (
	"fmt"
	"math/rand"
	"regexp"
	"sync"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/core/wallpaper"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
)

type Session struct {
	Timer      *time.Ticker
	StopChan   chan bool
	PauseChan  chan bool
	ResumeChan chan bool
	UpdateChan chan float64
	Paused     bool
	Playlist   *Playlist
	Wallpapers []string
}

type Service struct {
	wallpaperService       *wallpaper.Service
	activePlaylistSessions map[string]*Session
	mutex                  sync.Mutex
}

func NewService(wallpaperService *wallpaper.Service) *Service {
	return &Service{
		wallpaperService:       wallpaperService,
		activePlaylistSessions: make(map[string]*Session),
	}
}

func (service *Service) StartPlaylistCycle(screenName string) error {
	service.mutex.Lock()
	defer service.mutex.Unlock()

	service.stopPlaylistCycleInternal(screenName)

	appConfig, err := config.ReadConfig()
	if err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	if appConfig.Playlist == "" {
		return fmt.Errorf("no playlist configured")
	}

	var session *Session
	if appConfig.Playlist == "Random All" {
		wallpapers, err := wallpaper.GetWallpapers()
		if err != nil {
			return fmt.Errorf("failed to get all wallpapers: %w", err)
		}
		var ids []string
		for id := range wallpapers {
			ids = append(ids, id)
		}
		session = &Session{
			Playlist: &Playlist{
				Name: "Random All",
				Settings: PlaylistSettings{
					Delay: int(appConfig.PlaylistInterval * 60),
				},
			},
			Wallpapers: ids,
		}
	} else {
		playlists, err := GetPlaylists()
		if err != nil {
			return fmt.Errorf("failed to get playlists: %w", err)
		}

		var selectedPlaylist *Playlist
		for i := range playlists {
			if playlists[i].Name == appConfig.Playlist {
				selectedPlaylist = &playlists[i]
				break
			}
		}

		if selectedPlaylist == nil {
			return fmt.Errorf("playlist '%s' not found", appConfig.Playlist)
		}

		if len(selectedPlaylist.Items) == 0 {
			return fmt.Errorf("playlist '%s' has no wallpapers", appConfig.Playlist)
		}

		session = &Session{
			Playlist:   selectedPlaylist,
			Wallpapers: service.extractWallpaperIDs(selectedPlaylist.Items),
		}
	}

	if len(session.Wallpapers) == 0 {
		return fmt.Errorf("no valid wallpapers found in playlist")
	}

	if err := service.applyRandomPlaylistWallpaper(appConfig, session, screenName); err != nil {
		logger.Error("Failed to apply initial playlist wallpaper: %v", err)
	}

	if session.Playlist.Settings.Delay == 0 {
		logger.Printf("Playlist delay is 0, applied single wallpaper from playlist '%s'", appConfig.Playlist)
		return nil
	}

	interval := time.Duration(session.Playlist.Settings.Delay) * time.Second
	if interval < 1*time.Second {
		interval = 1 * time.Second
	}

	session.Timer = time.NewTicker(interval)
	session.StopChan = make(chan bool)
	session.PauseChan = make(chan bool)
	session.ResumeChan = make(chan bool)
	session.UpdateChan = make(chan float64)
	session.Paused = false

	service.activePlaylistSessions[screenName] = session

	go func() {
		for {
			select {
			case <-session.Timer.C:
				if !session.Paused {
					currentConfig, err := config.ReadConfig()
					if err != nil {
						logger.Error("Failed to read config for playlist on screen %s: %v", screenName, err)
						continue
					}
					if err := service.applyRandomPlaylistWallpaper(currentConfig, session, screenName); err != nil {
						logger.Error("Failed to apply playlist wallpaper on screen %s: %v", screenName, err)
					}
				}
			case <-session.PauseChan:
				session.Paused = true
			case <-session.ResumeChan:
				session.Paused = false
			case newIntervalMinutes := <-session.UpdateChan:
				session.Timer.Stop()
				newInterval := time.Duration(newIntervalMinutes * float64(time.Minute))
				if newInterval < 1*time.Second {
					newInterval = 1 * time.Second
				}
				session.Timer = time.NewTicker(newInterval)
				logger.Printf("Updated playlist interval for screen %s to %v", screenName, newInterval)
			case <-session.StopChan:
				return
			}
		}
	}()

	logger.Printf("Started playlist cycle for screen '%s' with playlist '%s' (%d wallpapers), interval: %v",
		screenName, appConfig.Playlist, len(session.Wallpapers), interval)
	return nil
}

func (service *Service) StopPlaylistCycle(screenName string) {
	service.mutex.Lock()
	defer service.mutex.Unlock()
	service.stopPlaylistCycleInternal(screenName)
}

func (service *Service) stopPlaylistCycleInternal(screenName string) {
	session, exists := service.activePlaylistSessions[screenName]
	if !exists {
		return
	}

	if session.Timer != nil {
		session.Timer.Stop()
	}
	if session.StopChan != nil {
		close(session.StopChan)
	}
	delete(service.activePlaylistSessions, screenName)
	logger.Printf("Stopped playlist cycle for screen '%s'", screenName)
}

func (service *Service) PausePlaylistCycle() {
	service.mutex.Lock()
	defer service.mutex.Unlock()

	for _, session := range service.activePlaylistSessions {
		if session.Timer != nil && session.PauseChan != nil && !session.Paused {
			select {
			case session.PauseChan <- true:
				logger.Printf("Paused playlist cycle")
			default:
			}
		}
	}
}

func (service *Service) ResumePlaylistCycle() {
	service.mutex.Lock()
	defer service.mutex.Unlock()

	for _, session := range service.activePlaylistSessions {
		if session.Timer != nil && session.ResumeChan != nil && session.Paused {
			select {
			case session.ResumeChan <- true:
				logger.Printf("Resumed playlist cycle")
			default:
			}
		}
	}
}

func (service *Service) UpdatePlaylistInterval(screenName string, intervalMinutes float64) error {
	service.mutex.Lock()
	defer service.mutex.Unlock()

	session, exists := service.activePlaylistSessions[screenName]
	if !exists || session.Timer == nil || session.UpdateChan == nil {
		return fmt.Errorf("no playlist is currently running for screen %s", screenName)
	}

	if session.Playlist != nil && session.Playlist.Name != "Random All" {
		if err := UpdatePlaylistIntervalConfig(session.Playlist.Name, intervalMinutes); err != nil {
			logger.Printf("Warning: failed to update playlist interval config: %v", err)
		}
	}

	select {
	case session.UpdateChan <- intervalMinutes:
		logger.Printf("Sent interval update signal to screen %s: %f minutes", screenName, intervalMinutes)
		return nil
	case <-time.After(1 * time.Second):
		return fmt.Errorf("timeout sending interval update to screen %s", screenName)
	}
}

func (service *Service) extractWallpaperIDs(items []string) []string {
	var ids []string
	regex := regexp.MustCompile(`431960[/\\](\d+)[/\\]`)

	for _, item := range items {
		matches := regex.FindStringSubmatch(item)
		if len(matches) > 1 {
			ids = append(ids, matches[1])
		}
	}

	return ids
}

func (service *Service) applyRandomPlaylistWallpaper(appConfig config.AppConfig, session *Session, screenName string) error {
	if session.Playlist != nil && session.Playlist.Name == "Random All" {
		wallpapers, err := wallpaper.GetWallpapers()
		if err == nil {
			var ids []string
			for id := range wallpapers {
				ids = append(ids, id)
			}
			if len(ids) > 0 {
				session.Wallpapers = ids
			}
		}
	}

	if len(session.Wallpapers) == 0 {
		return fmt.Errorf("no wallpapers in playlist")
	}

	randomIndex := rand.Intn(len(session.Wallpapers))
	wallpaperID := session.Wallpapers[randomIndex]

	updatedConfig := appConfig
	if screenName == "Global" {
		globalWallpaper := wallpaperID
		updatedConfig.GlobalWallpaper = &globalWallpaper
	} else {
		screenUpdated := false
		for i := range updatedConfig.Screens {
			if updatedConfig.Screens[i].Name == screenName {
				updatedConfig.Screens[i].Wallpaper = &wallpaperID
				if session.Playlist != nil {
					updatedConfig.Screens[i].Playlist = session.Playlist.Name
					updatedConfig.Screens[i].PlaylistInterval = float64(session.Playlist.Settings.Delay) / 60.0
				}
				screenUpdated = true
				break
			}
		}
		if !screenUpdated {
			return fmt.Errorf("screen '%s' not found in config", screenName)
		}
	}

	if err := config.WriteConfig(updatedConfig); err != nil {
		return fmt.Errorf("failed to update config: %w", err)
	}

	if err := service.wallpaperService.ApplyWallpapers(); err != nil {
		return fmt.Errorf("failed to apply wallpapers: %w", err)
	}

	logger.Printf("Applied random playlist wallpaper '%s' to screen '%s'", wallpaperID, screenName)
	return nil
}

func (service *Service) GetPlaylistStatus() map[string]interface{} {
	service.mutex.Lock()
	defer service.mutex.Unlock()

	status := make(map[string]interface{})

	for screenName, session := range service.activePlaylistSessions {
		screenStatus := map[string]interface{}{
			"active": session.Timer != nil,
		}
		if session.Playlist != nil {
			screenStatus["playlist"] = session.Playlist.Name
			screenStatus["wallpaperCount"] = len(session.Wallpapers)
		}
		status[screenName] = screenStatus
	}

	if len(status) == 0 {
		return map[string]interface{}{}
	}

	return status
}
