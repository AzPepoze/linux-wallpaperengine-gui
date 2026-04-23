package fullscreen

import (
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os/exec"
	"strings"
	"time"
)

var (
	isFullscreenDetected bool
	detectorRunning      bool
	statusChangeCallback func(bool)
)

// IsFullscreen returns whether a fullscreen window is currently detected
func IsFullscreen() bool {
	return isFullscreenDetected
}

// StartDetector starts monitoring for fullscreen windows
func StartDetector(callback func(bool)) {
	if detectorRunning {
		return
	}

	statusChangeCallback = callback
	detectorRunning = true

	go func() {
		lastStatus := false
		for detectorRunning {
			conf, err := config.GetConfig()
			if err != nil {
				time.Sleep(2 * time.Second)
				continue
			}

			// If NoFullscreenPause is enabled, we don't need to detect
			if conf.NoFullscreenPause {
				if isFullscreenDetected {
					isFullscreenDetected = false
					if statusChangeCallback != nil {
						statusChangeCallback(false)
					}
				}
				time.Sleep(2 * time.Second)
				continue
			}

			// Check for fullscreen window
			currentStatus := checkFullscreenWindow()

			if currentStatus != lastStatus {
				isFullscreenDetected = currentStatus
				lastStatus = currentStatus

				if statusChangeCallback != nil {
					statusChangeCallback(currentStatus)
				}

				if currentStatus {
					logger.Printf("Fullscreen window detected - pausing playlist")
				} else {
					logger.Printf("Fullscreen window closed - resuming playlist")
				}
			}

			time.Sleep(2 * time.Second)
		}
	}()

	logger.Println("Fullscreen detector started")
}

// StopDetector stops the fullscreen detection
func StopDetector() {
	detectorRunning = false
	logger.Println("Fullscreen detector stopped")
}

// checkFullscreenWindow checks if the active window is fullscreen using xprop
func checkFullscreenWindow() bool {
	// Get the active window ID
	cmd := exec.Command("xprop", "-root", "_NET_ACTIVE_WINDOW")
	output, err := cmd.Output()
	if err != nil {
		return false
	}

	// Parse window ID from output like: "_NET_ACTIVE_WINDOW(WINDOW): window id # 0x2e00006"
	parts := strings.Split(string(output), "#")
	if len(parts) < 2 {
		return false
	}

	windowID := strings.TrimSpace(parts[1])
	if windowID == "" || windowID == "0x0" {
		return false
	}

	// Check if the window has the fullscreen state
	cmd = exec.Command("xprop", "-id", windowID, "_NET_WM_STATE")
	output, err = cmd.Output()
	if err != nil {
		return false
	}

	// Check if _NET_WM_STATE_FULLSCREEN is in the state
	return strings.Contains(string(output), "_NET_WM_STATE_FULLSCREEN")
}
