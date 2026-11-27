package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"syscall"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/platform/process"
)

const quitWait = 5 * time.Second

var errNoInstance = errors.New("no running instance")

func (application *App) quitRunningInstance() {
	message, err := quitRunning(application.socketPath, quitWait, process.StopEngines)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err.Error())
		os.Exit(1)
	}
	fmt.Println(message)
}

func quitRunning(socketPath string, wait time.Duration, stop func() (bool, error)) (string, error) {
	sendErr := sendQuit(socketPath, wait)
	instanceWasRunning := sendErr == nil
	stopped, stopErr := stop()

	if sendErr != nil && !errors.Is(sendErr, errNoInstance) {
		if stopErr != nil {
			return "", fmt.Errorf("failed to quit the running instance: %v; failed to stop wallpaper processes: %w", sendErr, stopErr)
		}
		if stopped {
			return "", fmt.Errorf("failed to quit the running instance: %v; stopped wallpaper processes", sendErr)
		}
		return "", fmt.Errorf("failed to quit the running instance: %w", sendErr)
	}

	if stopErr != nil {
		if instanceWasRunning {
			return "", fmt.Errorf("quit the running instance, but failed to stop wallpaper processes: %w", stopErr)
		}
		return "", fmt.Errorf("failed to stop wallpaper processes: %w", stopErr)
	}

	if instanceWasRunning {
		return "Quit the running instance and stopped wallpaper processes.", nil
	}
	if stopped {
		return "No running instance. Stopped wallpaper processes.", nil
	}
	return "No running instance.", nil
}

func sendQuit(socketPath string, wait time.Duration) error {
	dialer := net.Dialer{Timeout: wait}
	connection, err := dialer.Dial("unix", socketPath)
	if err != nil {
		if os.IsNotExist(err) || errors.Is(err, syscall.ECONNREFUSED) {
			return errNoInstance
		}
		return err
	}
	defer connection.Close()

	if err := connection.SetDeadline(time.Now().Add(wait)); err != nil {
		return err
	}

	request := models.Request{
		ID:     998,
		Method: "quit",
	}
	if err := json.NewEncoder(connection).Encode(request); err != nil {
		return err
	}

	buffer := make([]byte, 4096)
	for {
		_, err := connection.Read(buffer)
		if err == nil {
			continue
		}
		if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) || errors.Is(err, syscall.ECONNRESET) {
			return nil
		}
		return err
	}
}
