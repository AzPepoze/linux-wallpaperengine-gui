package proton

import (
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os"
	"strconv"
	"strings"
	"time"
)

var (
	isProtonGameDetected bool
	detectorRunning      bool
	statusChangeCallback func(bool)
)

// IsProton returns whether a game is currently running under Proton
func IsProton() bool {
	return isProtonGameDetected
}

// StartDetector starts monitoring for Proton games
func StartDetector(callback func(bool)) {
	if detectorRunning {
		return
	}

	statusChangeCallback = callback
	detectorRunning = true

	go func() {
		lastStatus := false
		lastGamePID := 0
		currentStatus := false
		for detectorRunning {
			conf, err := config.GetConfig()
			if err != nil {
				time.Sleep(5 * time.Second)
				continue
			}

			// If ProtonStop is disabled, we don't need to detect
			if !conf.ProtonStop {
				if isProtonGameDetected {
					isProtonGameDetected = false
					lastStatus = false
					if statusChangeCallback != nil {
						statusChangeCallback(false)
					}
				}
				time.Sleep(5 * time.Second)
				continue
			}

			// Only scan all process if no Proton game was detected before,
			// otherwise only check if the last known PID is still running and still belongs to Proton
			if lastGamePID != 0 {
				currentStatus, lastGamePID = checkProtonGameStillRunning(lastGamePID)
			} else {
				currentStatus, lastGamePID = checkProtonGame()
			}

			if currentStatus != lastStatus {
				isProtonGameDetected = currentStatus
				lastStatus = currentStatus

				if currentStatus {
					logger.Printf("Proton game detected - pausing playlist and killing wallpapers")
				} else {
					logger.Printf("Proton game closed - resuming playlist and applying wallpapers")
				}

				if statusChangeCallback != nil {
					statusChangeCallback(currentStatus)
				}
			}

			time.Sleep(5 * time.Second)
		}
	}()

	logger.Println("Proton detector started")
}

func checkProtonGame() (bool, int) {
	// Search for a proton process in /proc
	procs, err := os.ReadDir("/proc")

	if err != nil {
		return false, 0
	}

	for _, proc := range procs {
		if !proc.IsDir() {
			continue
		}
		// Search for all PIDs in /proc (will only be numeric folders)
		if procPID, err := strconv.Atoi(proc.Name()); err == nil {
			cmdlinePath := fmt.Sprintf("/proc/%d/cmdline", procPID)
			if cmdlineBytes, err := os.ReadFile(cmdlinePath); err == nil {
				//Check if the process' cmdline includes the text "/proton",
				//which implies the proton script is running
				if strings.Contains(string(cmdlineBytes), "/proton") {
					return true, procPID
				}
			}
		}
	}
	return false, 0
}

func checkProtonGameStillRunning(lastGamePID int) (bool, int) {
	cmdlinePath := fmt.Sprintf("/proc/%d/cmdline", lastGamePID)
	if cmdlineBytes, err := os.ReadFile(cmdlinePath); err == nil {
		if strings.Contains(string(cmdlineBytes), "/proton") {
			return true, lastGamePID
		}
	}
	return false, 0
}

// StopDetector stops the Proton detection
func StopDetector() {
	detectorRunning = false
	logger.Println("Proton detector stopped")
}
