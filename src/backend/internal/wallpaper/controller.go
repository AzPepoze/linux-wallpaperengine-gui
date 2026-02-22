package wallpaper

import (
	"bufio"
	"io"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os/exec"
	"strings"
	"sync"
	"syscall"
)

type ActiveWallpaper struct {
	Cmd     *exec.Cmd
	Command string
}

var (
	activeWallpapers = make(map[string]*ActiveWallpaper)
	mu               sync.Mutex
)

func UpdateWallpapers(desiredWallpapers []struct {
	Screen  string
	Command string
}) {
	mu.Lock()
	defer mu.Unlock()

	desiredScreens := make(map[string]bool)
	for _, dw := range desiredWallpapers {
		desiredScreens[dw.Screen] = true
	}

	// Kill wallpapers no longer desired
	for screen := range activeWallpapers {
		if !desiredScreens[screen] {
			killWallpaper(screen)
		}
	}

	// Start or update wallpapers
	for _, dw := range desiredWallpapers {
		active, exists := activeWallpapers[dw.Screen]
		if exists {
			if active.Command == dw.Command {
				logger.Printf("Wallpaper for %s is already running.", dw.Screen)
				continue
			}
			logger.Printf("Updating wallpaper for %s...", dw.Screen)
			killWallpaper(dw.Screen)
		}

		logger.Printf("Starting wallpaper for %s... (%s)", dw.Screen, dw.Command)
		spawnWallpaper(dw.Screen, dw.Command)
	}
}

func killWallpaper(screen string) {
	active, exists := activeWallpapers[screen]
	if !exists {
		return
	}

	logger.Printf("Killing wallpaper for %s", screen)
	if active.Cmd.Process != nil {
		// Try to kill process group
		pgid, err := syscall.Getpgid(active.Cmd.Process.Pid)
		if err == nil {
			if err := syscall.Kill(-pgid, syscall.SIGTERM); err != nil {
				logger.Printf("Error killing process group: %v", err)
			}
		} else {
			if err := active.Cmd.Process.Kill(); err != nil {
				logger.Printf("Error killing process: %v", err)
			}
		}
	}
	delete(activeWallpapers, screen)
}

func KillWallpaperByFolderName(folderName string) {
	mu.Lock()
	defer mu.Unlock()

	for screen, active := range activeWallpapers {
		if strings.Contains(active.Command, folderName) {
			logger.Printf("Killing wallpaper with folder name %s on screen %s", folderName, screen)
			killWallpaper(screen)
		}
	}
}

func spawnWallpaper(screen string, fullCommand string) {
	cmd := exec.Command("sh", "-c", fullCommand)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		logger.Printf("Failed to spawn wallpaper for %s: %v", screen, err)
		return
	}

	activeWallpapers[screen] = &ActiveWallpaper{
		Cmd:     cmd,
		Command: fullCommand,
	}

	// Handle stdout
	go captureOutput(screen, stdout)
	// Handle stderr
	go captureOutput(screen, stderr)

	go func() {
		if err := cmd.Wait(); err != nil {
			logger.Printf("Wallpaper process for %s exited with error: %v", screen, err)
		}
		mu.Lock()
		if active, exists := activeWallpapers[screen]; exists && active.Cmd == cmd {
			delete(activeWallpapers, screen)
		}
		mu.Unlock()
	}()
}

func captureOutput(screen string, rc io.ReadCloser) {
	scanner := bufio.NewScanner(rc)
	for scanner.Scan() {
		msg := scanner.Text()
		if msg != "" {
			logger.WallpaperLog(screen, msg)
		}
	}
}

func KillAll() {
	mu.Lock()
	defer mu.Unlock()
	for screen := range activeWallpapers {
		killWallpaper(screen)
	}
	if err := exec.Command("killall", "-e", "linux-wallpaperengine").Run(); err != nil {
		logger.Printf("killall linux-wallpaperengine failed: %v", err)
	}
}
