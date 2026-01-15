package wallpaper

import (
	"bufio"
	"io"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os/exec"
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
			syscall.Kill(-pgid, syscall.SIGTERM)
		} else {
			active.Cmd.Process.Kill()
		}
	}
	delete(activeWallpapers, screen)
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
		cmd.Wait()
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
	exec.Command("killall", "-e", "linux-wallpaperengine").Run()
}
