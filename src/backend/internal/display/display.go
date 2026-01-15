package display

import (
	"os/exec"
	"strings"
	"time"
)

func GetScreens() ([]string, error) {
	out, err := exec.Command("xrandr", "--query").Output()
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(out), "\n")
	var screens []string
	for _, line := range lines {
		if strings.Contains(line, " connected") {
			parts := strings.Split(line, " ")
			if len(parts) > 0 {
				screens = append(screens, parts[0])
			}
		}
	}

	return screens, nil
}

func StartWatcher(callback func()) {
	go func() {
		lastScreens, _ := GetScreens()
		for {
			time.Sleep(2 * time.Second)
			currentScreens, err := GetScreens()
			if err != nil {
				continue
			}

			if !equal(lastScreens, currentScreens) {
				lastScreens = currentScreens
				callback()
			}
		}
	}()
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
