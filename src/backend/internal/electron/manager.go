package electron

import (
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

var electronProcess *os.Process

func IsRunning() bool {
	return electronProcess != nil
}

func IsWaylandSession() bool {
	sessionType := strings.ToLower(os.Getenv("XDG_SESSION_TYPE"))
	waylandDisplay := os.Getenv("WAYLAND_DISPLAY")
	return sessionType == "wayland" || waylandDisplay != ""
}

func Start() {
	if electronProcess != nil {
		return
	}

	conf, _ := config.GetConfig()
	executable, _ := os.Executable()
	appDir := filepath.Dir(executable)

	// Check if --native-wayland was passed to the backend to override config
	forceNativeWayland := false
	for _, arg := range os.Args {
		if arg == "--native-wayland" {
			forceNativeWayland = true
			break
		}
	}

	platform := "x11"
	if conf.NativeWayland || forceNativeWayland {
		platform = "wayland"
	}

	ozoneFlag := "--ozone-platform=" + platform
	logger.Printf("Configuring Electron to use %s (NativeWayland: %v, Force: %v)", platform, conf.NativeWayland, forceNativeWayland)

	var name string
	var args []string

	if filepath.Base(appDir) == "resources" {
		logger.Println("Production mode detected...")
		name = filepath.Join(appDir, "..", "linux-wallpaperengine-gui")
		if _, err := os.Stat(name); os.IsNotExist(err) {
			name = filepath.Join(appDir, "linux-wallpaperengine-gui")
		}
		args = []string{ozoneFlag}
	} else {
		logger.Println("Dev mode detected, running via pnpm...")
		name = "pnpm"
		args = []string{"run", "dev:frontend", "--", ozoneFlag}
	}

	cmd := exec.Command(name, args...)
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "INTERNAL_START=true")

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	logger.Printf("Starting GUI: %s %s", name, strings.Join(args, " "))

	if err := cmd.Start(); err != nil {
		logger.Error("Failed to start Electron: %v", err)
		return
	}

	electronProcess = cmd.Process
	logger.Printf("Electron started (PID: %d)", electronProcess.Pid)

	go func() {
		err := cmd.Wait()
		logger.Printf("Electron process exited: %v", err)
		electronProcess = nil
	}()
}

func Stop() {
	if electronProcess != nil {
		logger.Println("Stopping Electron process...")
		if err := electronProcess.Kill(); err != nil {
			logger.Printf("Error killing Electron process: %v", err)
		}
		electronProcess = nil
	}
}
