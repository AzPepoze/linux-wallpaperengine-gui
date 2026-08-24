//go:build linux && cgo

package steamworks

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const flatpakSteamAppID = "com.valvesoftware.Steam"

type helperRequest struct {
	ID     int         `json:"id"`
	Method string      `json:"method"`
	Params interface{} `json:"params,omitempty"`
}

type helperResponse struct {
	ID     int             `json:"id"`
	Result json.RawMessage `json:"result,omitempty"`
	Error  string          `json:"error,omitempty"`
}

type flatpakHelperClient struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	scan   *bufio.Scanner
	stderr *bytes.Buffer
	mu     sync.Mutex
	nextID int
}

var (
	flatpakClientMu sync.Mutex
	flatpakClient   *flatpakHelperClient
	flatpakLastErr  string

	flatpakDetectMu      sync.Mutex
	flatpakDetectAt      time.Time
	flatpakDetectRunning bool
)

func shouldUseFlatpakSteam() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("LWE_STEAM_PROVIDER"))) {
	case "native", "direct":
		return false
	case "flatpak":
		return true
	}
	return flatpakSteamRunning()
}

func flatpakSteamRunning() bool {
	flatpakDetectMu.Lock()
	defer flatpakDetectMu.Unlock()
	if time.Since(flatpakDetectAt) < 1500*time.Millisecond {
		return flatpakDetectRunning
	}

	flatpakDetectAt = time.Now()
	flatpakDetectRunning = false
	if _, err := exec.LookPath("flatpak"); err != nil {
		return false
	}
	output, err := exec.Command("flatpak", "ps", "--columns=application").Output()
	if err != nil {
		return false
	}
	for _, line := range strings.Split(string(output), "\n") {
		if strings.TrimSpace(line) == flatpakSteamAppID {
			flatpakDetectRunning = true
			break
		}
	}
	return flatpakDetectRunning
}

func resolveSteamHelper() (string, error) {
	if configured := strings.TrimSpace(os.Getenv("LWE_STEAM_HELPER")); configured != "" {
		if info, err := os.Stat(configured); err == nil && !info.IsDir() {
			return configured, nil
		}
	}

	executable, _ := os.Executable()
	executableDir := filepath.Dir(executable)
	cwd, _ := os.Getwd()
	candidates := []string{
		filepath.Join(executableDir, "linux-wallpaperengine-steam-helper"),
		filepath.Join(executableDir, "..", "lib", "linux-wallpaperengine-gui", "linux-wallpaperengine-steam-helper"),
		filepath.Join(cwd, "build", "backend", "linux-wallpaperengine-steam-helper"),
		"/usr/lib/linux-wallpaperengine-gui/linux-wallpaperengine-steam-helper",
		"/usr/local/lib/linux-wallpaperengine-gui/linux-wallpaperengine-steam-helper",
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}
	if path, err := exec.LookPath("linux-wallpaperengine-steam-helper"); err == nil {
		return path, nil
	}
	return "", errors.New("Steamworks helper is not installed; rebuild/install linux-wallpaperengine-gui with the helper binary")
}

func fileDigest(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:8]), nil
}

func copyExecutable(source, destination string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()

	if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
		return err
	}
	temp := destination + ".tmp"
	output, err := os.OpenFile(temp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o755)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()
	if copyErr != nil {
		_ = os.Remove(temp)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(temp)
		return closeErr
	}
	if err := os.Chmod(temp, 0o755); err != nil {
		_ = os.Remove(temp)
		return err
	}
	return os.Rename(temp, destination)
}

func stageFlatpakHelper() (string, error) {
	source, err := resolveSteamHelper()
	if err != nil {
		return "", err
	}
	digest, err := fileDigest(source)
	if err != nil {
		return "", err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	name := "linux-wallpaperengine-steam-helper-" + digest
	hostDir := filepath.Join(home, ".var", "app", flatpakSteamAppID, ".local", "share", "linux-wallpaperengine-gui")
	hostPath := filepath.Join(hostDir, name)
	if _, err := os.Stat(hostPath); os.IsNotExist(err) {
		if err := copyExecutable(source, hostPath); err != nil {
			return "", fmt.Errorf("stage Steamworks helper: %w", err)
		}
	}

	// Steam's --persist=. mapping makes the host app-data directory appear as HOME.
	return "$HOME/.local/share/linux-wallpaperengine-gui/" + name, nil
}

func resolveSteamAPILibraryForStaging() string {
	if configured := strings.TrimSpace(os.Getenv("LWE_STEAM_API_LIBRARY")); configured != "" {
		if info, err := os.Stat(configured); err == nil && !info.IsDir() {
			return configured
		}
	}

	helper, err := resolveSteamHelper()
	if err != nil {
		return ""
	}
	candidates := []string{
		filepath.Join(filepath.Dir(helper), "libsteam_api.so"),
		"/usr/lib/linux-wallpaperengine-gui/libsteam_api.so",
		"/usr/local/lib/linux-wallpaperengine-gui/libsteam_api.so",
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}
	return ""
}

func stageSteamAPILibrary() (string, error) {
	source := resolveSteamAPILibraryForStaging()
	if source == "" {
		return "", nil
	}
	digest, err := fileDigest(source)
	if err != nil {
		return "", err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	name := "libsteam_api-" + digest + ".so"
	hostPath := filepath.Join(home, ".var", "app", flatpakSteamAppID, ".local", "share", "linux-wallpaperengine-gui", name)
	if _, err := os.Stat(hostPath); os.IsNotExist(err) {
		if err := copyExecutable(source, hostPath); err != nil {
			return "", err
		}
	}
	return "$HOME/.local/share/linux-wallpaperengine-gui/" + name, nil
}

func startFlatpakHelper() (*flatpakHelperClient, error) {
	if !flatpakSteamRunning() {
		return nil, errors.New("Flatpak Steam is not running")
	}
	if _, err := exec.LookPath("flatpak"); err != nil {
		return nil, errors.New("flatpak command is unavailable")
	}
	insideHelper, err := stageFlatpakHelper()
	if err != nil {
		return nil, err
	}
	insideLibrary, err := stageSteamAPILibrary()
	if err != nil {
		return nil, fmt.Errorf("stage libsteam_api.so: %w", err)
	}

	command := `export LWE_STEAM_PROVIDER=native; `
	if insideLibrary != "" {
		command += `export LWE_STEAM_API_LIBRARY="` + insideLibrary + `"; `
	}
	command += `exec "` + insideHelper + `"`

	cmd := exec.Command("flatpak", "enter", flatpakSteamAppID, "/usr/bin/sh", "-lc", command)
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr := &bytes.Buffer{}
	cmd.Stderr = stderr
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("enter Flatpak Steam sandbox: %w", err)
	}

	client := &flatpakHelperClient{
		cmd:    cmd,
		stdin:  stdin,
		scan:   bufio.NewScanner(stdout),
		stderr: stderr,
	}
	client.scan.Buffer(make([]byte, 4096), 4*1024*1024)
	var pong string
	if err := client.call("ping", nil, &pong); err != nil {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		if stderr.Len() > 0 {
			return nil, fmt.Errorf("Steamworks helper failed: %w: %s", err, strings.TrimSpace(stderr.String()))
		}
		return nil, fmt.Errorf("Steamworks helper failed: %w", err)
	}

	go func() {
		err := cmd.Wait()
		flatpakClientMu.Lock()
		if flatpakClient == client {
			flatpakClient = nil
			if err != nil && flatpakLastErr == "" {
				flatpakLastErr = fmt.Sprintf("Steamworks helper exited: %v", err)
			}
		}
		flatpakClientMu.Unlock()
	}()
	return client, nil
}

func getFlatpakClient() (*flatpakHelperClient, error) {
	flatpakClientMu.Lock()
	defer flatpakClientMu.Unlock()
	if flatpakClient != nil {
		return flatpakClient, nil
	}
	client, err := startFlatpakHelper()
	if err != nil {
		flatpakLastErr = err.Error()
		return nil, err
	}
	flatpakClient = client
	flatpakLastErr = ""
	return client, nil
}

func resetFlatpakClient(client *flatpakHelperClient) {
	flatpakClientMu.Lock()
	defer flatpakClientMu.Unlock()
	if flatpakClient == client {
		flatpakClient = nil
	}
}

func (client *flatpakHelperClient) call(method string, params interface{}, target interface{}) error {
	client.mu.Lock()
	defer client.mu.Unlock()
	client.nextID++
	request := helperRequest{ID: client.nextID, Method: method, Params: params}
	data, err := json.Marshal(request)
	if err != nil {
		return err
	}
	if _, err := client.stdin.Write(append(data, '\n')); err != nil {
		return err
	}
	if !client.scan.Scan() {
		if err := client.scan.Err(); err != nil {
			return err
		}
		message := strings.TrimSpace(client.stderr.String())
		if message != "" {
			return errors.New(message)
		}
		return io.EOF
	}
	var response helperResponse
	if err := json.Unmarshal(client.scan.Bytes(), &response); err != nil {
		return err
	}
	if response.ID != request.ID {
		return fmt.Errorf("Steamworks helper response id mismatch: got %d, want %d", response.ID, request.ID)
	}
	if response.Error != "" {
		return errors.New(response.Error)
	}
	if target == nil || len(response.Result) == 0 || string(response.Result) == "null" {
		return nil
	}
	return json.Unmarshal(response.Result, target)
}

func flatpakCall(method string, params interface{}, target interface{}) error {
	client, err := getFlatpakClient()
	if err != nil {
		return err
	}
	if err := client.call(method, params, target); err != nil {
		flatpakLastErr = err.Error()
		resetFlatpakClient(client)
		return err
	}
	return nil
}

func flatpakAvailable() bool {
	var available bool
	if err := flatpakCall("available", nil, &available); err != nil {
		flatpakLastErr = err.Error()
		return false
	}
	return available
}

func flatpakError() string {
	if flatpakLastErr != "" {
		return flatpakLastErr
	}
	var message string
	if err := flatpakCall("last-error", nil, &message); err != nil {
		return err.Error()
	}
	return message
}

func flatpakShutdown() {
	flatpakClientMu.Lock()
	client := flatpakClient
	flatpakClient = nil
	flatpakClientMu.Unlock()
	if client == nil {
		return
	}
	_ = client.call("shutdown", nil, nil)
	_ = client.stdin.Close()
}
