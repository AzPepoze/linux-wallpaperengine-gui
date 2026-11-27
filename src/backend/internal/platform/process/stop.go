package process

import (
	"errors"
	"os/exec"
)

// No matching process is not an error.
func StopEngines() (bool, error) {
	return signalByName("linux-wallpaperengine")
}

func signalByName(name string) (bool, error) {
	command := exec.Command("killall", "-e", name)
	err := command.Run()
	if err == nil {
		return true, nil
	}

	var exitError *exec.ExitError
	if errors.As(err, &exitError) && exitError.ExitCode() == 1 {
		return false, nil
	}
	return false, err
}
