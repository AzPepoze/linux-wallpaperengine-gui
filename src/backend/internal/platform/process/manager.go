package process

import (
	"bufio"
	"io"
	"os/exec"
	"strings"
	"sync"
	"syscall"

	"linux-wallpaperengine-gui/src/backend/internal/logger"
)

type ActiveWallpaper struct {
	Cmd     *exec.Cmd
	Command string
}

type Manager struct {
	activeWallpapers map[string]*ActiveWallpaper
	mutex            sync.Mutex
}

func NewManager() *Manager {
	return &Manager{
		activeWallpapers: make(map[string]*ActiveWallpaper),
	}
}

func (manager *Manager) UpdateWallpapers(desiredWallpapers []struct {
	Screen  string
	Command string
}) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	desiredScreens := make(map[string]bool)
	for _, desiredWallpaper := range desiredWallpapers {
		desiredScreens[desiredWallpaper.Screen] = true
	}

	// Kill wallpapers no longer desired
	for screen := range manager.activeWallpapers {
		if !desiredScreens[screen] {
			manager.killWallpaperInternal(screen)
		}
	}

	// Start or update wallpapers
	for _, desiredWallpaper := range desiredWallpapers {
		active, exists := manager.activeWallpapers[desiredWallpaper.Screen]
		if exists {
			if active.Command == desiredWallpaper.Command {
				logger.Printf("Wallpaper for %s is already running.", desiredWallpaper.Screen)
				continue
			}
			logger.Printf("Updating wallpaper for %s...", desiredWallpaper.Screen)
			manager.killWallpaperInternal(desiredWallpaper.Screen)
		}

		logger.Printf("Starting wallpaper for %s... (%s)", desiredWallpaper.Screen, desiredWallpaper.Command)
		manager.spawnWallpaper(desiredWallpaper.Screen, desiredWallpaper.Command)
	}
}

func (manager *Manager) killWallpaperInternal(screen string) {
	active, exists := manager.activeWallpapers[screen]
	if !exists {
		return
	}

	logger.Printf("Killing wallpaper for %s", screen)
	if active.Cmd.Process != nil {
		// Try to kill process group
		processGroupID, err := syscall.Getpgid(active.Cmd.Process.Pid)
		if err == nil {
			if err := syscall.Kill(-processGroupID, syscall.SIGTERM); err != nil {
				logger.Printf("Error killing process group: %v", err)
			}
		} else {
			if err := active.Cmd.Process.Kill(); err != nil {
				logger.Printf("Error killing process: %v", err)
			}
		}
	}
	delete(manager.activeWallpapers, screen)
}

func (manager *Manager) KillByFolderName(folderName string) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	for screen, active := range manager.activeWallpapers {
		if strings.Contains(active.Command, folderName) {
			logger.Printf("Killing wallpaper with folder name %s on screen %s", folderName, screen)
			manager.killWallpaperInternal(screen)
		}
	}
}

func (manager *Manager) spawnWallpaper(screen string, fullCommand string) {
	command := exec.Command("sh", "-c", fullCommand)
	command.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	stdout, _ := command.StdoutPipe()
	stderr, _ := command.StderrPipe()

	if err := command.Start(); err != nil {
		logger.Printf("Failed to spawn wallpaper for %s: %v", screen, err)
		return
	}

	manager.activeWallpapers[screen] = &ActiveWallpaper{
		Cmd:     command,
		Command: fullCommand,
	}

	// Handle stdout
	go manager.captureOutput(screen, stdout)
	// Handle stderr
	go manager.captureOutput(screen, stderr)

	go func() {
		if err := command.Wait(); err != nil {
			logger.Printf("Wallpaper process for %s exited with error: %v", screen, err)
		}
		manager.mutex.Lock()
		if active, exists := manager.activeWallpapers[screen]; exists && active.Cmd == command {
			delete(manager.activeWallpapers, screen)
		}
		manager.mutex.Unlock()
	}()
}

func (manager *Manager) captureOutput(screen string, readCloser io.ReadCloser) {
	scanner := bufio.NewScanner(readCloser)
	for scanner.Scan() {
		message := scanner.Text()
		if message != "" {
			logger.WallpaperLog(screen, message)
		}
	}
}

func (manager *Manager) KillAll() {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()
	for screen := range manager.activeWallpapers {
		manager.killWallpaperInternal(screen)
	}
	if err := exec.Command("killall", "-e", "linux-wallpaperengine").Run(); err != nil {
		logger.Printf("killall linux-wallpaperengine failed: %v", err)
	}
}
