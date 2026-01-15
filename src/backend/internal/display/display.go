package display

import (
	"os/exec"
	"strings"
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
