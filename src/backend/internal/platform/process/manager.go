package process

import (
	"bufio"
	"io"
	"os/exec"
	"strings"
	"sync"
	"syscall"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/logger"
)

// handoffWindow is how long a handoff candidate may run before it is treated as the new owner.
const handoffWindow = 1500 * time.Millisecond

type ActiveWallpaper struct {
	Cmd     *exec.Cmd
	Command string
}

type Manager struct {
	activeWallpapers     map[string]*ActiveWallpaper
	mutex                sync.Mutex
	controlSocketHandoff bool
	handoffTimeout       time.Duration
}

func NewManager() *Manager {
	return &Manager{
		activeWallpapers: make(map[string]*ActiveWallpaper),
		handoffTimeout:   handoffWindow,
	}
}

// SetControlSocketHandoff enables live handoff for engines with a control socket.
func (manager *Manager) SetControlSocketHandoff(enabled bool) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if manager.controlSocketHandoff == enabled {
		return
	}
	manager.controlSocketHandoff = enabled
	if enabled {
		logger.Printf("Engine control-socket handoff enabled")
	} else {
		logger.Printf("Engine control-socket handoff disabled")
	}
}

func (manager *Manager) UpdateWallpapers(desiredWallpapers []struct {
	Screen  string
	Exec    string
	Args    []string
	Command string
}) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	desiredScreens := make(map[string]bool)
	for _, desiredWallpaper := range desiredWallpapers {
		desiredScreens[desiredWallpaper.Screen] = true
	}

	for screen := range manager.activeWallpapers {
		if screen == "__PREVIEW__" {
			continue
		}
		if !desiredScreens[screen] {
			manager.killWallpaperInternal(screen)
		}
	}

	for _, desiredWallpaper := range desiredWallpapers {
		active, exists := manager.activeWallpapers[desiredWallpaper.Screen]
		if exists {
			if active.Command == desiredWallpaper.Command {
				logger.Printf("Wallpaper for %s is already running.", desiredWallpaper.Screen)
				continue
			}

			if manager.controlSocketHandoff {
				logger.Printf("Handing off wallpaper for %s...", desiredWallpaper.Screen)
				if manager.handoffWallpaper(desiredWallpaper.Screen, active, desiredWallpaper.Exec, desiredWallpaper.Args, desiredWallpaper.Command) {
					continue
				}
				logger.Printf("Handoff for %s could not start; falling back to restart", desiredWallpaper.Screen)
			}

			logger.Printf("Updating wallpaper for %s...", desiredWallpaper.Screen)
			manager.killWallpaperInternal(desiredWallpaper.Screen)
		}

		logger.Printf("Starting wallpaper for %s... (%s %v)", desiredWallpaper.Screen, desiredWallpaper.Exec, desiredWallpaper.Args)
		manager.spawnWallpaper(desiredWallpaper.Screen, desiredWallpaper.Exec, desiredWallpaper.Args, desiredWallpaper.Command)
	}
}

// handoffWallpaper spawns a transient candidate to crossfade; false if it won't start.
func (manager *Manager) handoffWallpaper(screen string, owner *ActiveWallpaper, execPath string, args []string, fullCommand string) bool {
	candidate, err := manager.spawnProcess(screen, execPath, args)
	if err != nil {
		logger.Printf("Failed to spawn handoff candidate for %s: %v", screen, err)
		return false
	}

	go manager.watchHandoffCandidate(screen, owner, candidate, fullCommand)
	return true
}

// watchHandoffCandidate resolves the handoff without blocking: a quick exit means
// the crossfade ran, outliving the window means the candidate is the new owner.
func (manager *Manager) watchHandoffCandidate(screen string, owner *ActiveWallpaper, candidate *exec.Cmd, fullCommand string) {
	exited := make(chan error, 1)
	go func() {
		exited <- candidate.Wait()
	}()

	select {
	case <-exited:
		manager.mutex.Lock()
		if current, exists := manager.activeWallpapers[screen]; exists && current == owner {
			current.Command = fullCommand
		}
		manager.mutex.Unlock()
		logger.Printf("Wallpaper handoff succeeded for %s", screen)

	case <-time.After(manager.handoffTimeout):
		manager.mutex.Lock()
		current, exists := manager.activeWallpapers[screen]
		if exists && current != owner {
			// Owner changed mid-handoff; this candidate is stale.
			manager.mutex.Unlock()
			terminateProcess(candidate)
			<-exited
			logger.Printf("Discarded stale handoff candidate for %s", screen)
			return
		}

		delete(manager.activeWallpapers, screen)
		manager.activeWallpapers[screen] = &ActiveWallpaper{Cmd: candidate, Command: fullCommand}
		manager.mutex.Unlock()
		logger.Printf("Handoff candidate for %s is still running; promoted it to owner", screen)

		// Untrack the promoted candidate once it exits.
		<-exited
		manager.mutex.Lock()
		if tracked, ok := manager.activeWallpapers[screen]; ok && tracked.Cmd == candidate {
			delete(manager.activeWallpapers, screen)
		}
		manager.mutex.Unlock()
	}
}

func (manager *Manager) killWallpaperInternal(screen string) {
	active, exists := manager.activeWallpapers[screen]
	if !exists {
		return
	}

	logger.Printf("Killing wallpaper for %s", screen)
	terminateProcess(active.Cmd)
	delete(manager.activeWallpapers, screen)
}

// terminateProcess kills the process group, falling back to the process itself.
func terminateProcess(command *exec.Cmd) {
	if command == nil || command.Process == nil {
		return
	}

	processGroupID, err := syscall.Getpgid(command.Process.Pid)
	if err == nil {
		if err := syscall.Kill(-processGroupID, syscall.SIGTERM); err != nil {
			logger.Printf("Error killing process group: %v", err)
		}
		return
	}
	if err := command.Process.Kill(); err != nil {
		logger.Printf("Error killing process: %v", err)
	}
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

func (manager *Manager) spawnWallpaper(screen string, execPath string, args []string, fullCommand string) {
	command, err := manager.spawnProcess(screen, execPath, args)
	if err != nil {
		logger.Printf("Failed to spawn wallpaper for %s: %v", screen, err)
		return
	}

	manager.activeWallpapers[screen] = &ActiveWallpaper{
		Cmd:     command,
		Command: fullCommand,
	}

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

// spawnProcess starts a command in its own process group with streamed output.
func (manager *Manager) spawnProcess(screen string, execPath string, args []string) (*exec.Cmd, error) {
	command := exec.Command(execPath, args...)
	command.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	stdout, err := command.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := command.StderrPipe()
	if err != nil {
		return nil, err
	}

	if err := command.Start(); err != nil {
		return nil, err
	}

	go manager.captureOutput(screen, stdout)
	go manager.captureOutput(screen, stderr)

	return command, nil
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

func (manager *Manager) UpdatePreview(execPath string, args []string, fullCommand string) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if _, exists := manager.activeWallpapers["__PREVIEW__"]; exists {
		manager.killWallpaperInternal("__PREVIEW__")
	}

	logger.Printf("Starting preview window... (%s %v)", execPath, args)
	manager.spawnWallpaper("__PREVIEW__", execPath, args, fullCommand)
}

func (manager *Manager) StopPreview() {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if _, exists := manager.activeWallpapers["__PREVIEW__"]; exists {
		manager.killWallpaperInternal("__PREVIEW__")
	}
}

func (manager *Manager) IsPreviewRunning() bool {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	_, exists := manager.activeWallpapers["__PREVIEW__"]
	return exists
}
