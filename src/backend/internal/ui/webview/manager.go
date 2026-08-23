package webview

import (
	"bufio"
	"fmt"
	"linux-wallpaperengine-gui/src/backend/internal/config"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
)

var (
	processMu      sync.Mutex
	webviewProcess *os.Process
)

func IsRunning() bool {
	processMu.Lock()
	defer processMu.Unlock()
	return webviewProcess != nil
}

func IsWaylandSession() bool {
	sessionType := strings.ToLower(os.Getenv("XDG_SESSION_TYPE"))
	return sessionType == "wayland" || os.Getenv("WAYLAND_DISPLAY") != ""
}

func hasArg(name string) bool {
	for _, arg := range os.Args[1:] {
		if arg == name {
			return true
		}
	}
	return false
}

func firstExecutable(candidates ...string) (string, error) {
	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		if strings.ContainsRune(candidate, filepath.Separator) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() && info.Mode()&0o111 != 0 {
				return candidate, nil
			}
			continue
		}
		if path, err := exec.LookPath(candidate); err == nil {
			return path, nil
		}
	}
	return "", fmt.Errorf("linux-wallpaperengine-webview is not installed; install the Qt WebEngine host package")
}

func resolveHost() (string, error) {
	executable, _ := os.Executable()
	executableDir := filepath.Dir(executable)
	cwd, _ := os.Getwd()

	return firstExecutable(
		os.Getenv("LWE_GUI_WEBVIEW"),
		filepath.Join(executableDir, "linux-wallpaperengine-webview"),
		filepath.Join(executableDir, "..", "lib", "linux-wallpaperengine-gui", "linux-wallpaperengine-webview"),
		filepath.Join(cwd, "build", "native", "linux-wallpaperengine-webview"),
		"linux-wallpaperengine-webview",
	)
}

func resolveFrontendDir() string {
	if configured := os.Getenv("LWE_GUI_FRONTEND_DIR"); configured != "" {
		return configured
	}

	executable, _ := os.Executable()
	executableDir := filepath.Dir(executable)
	cwd, _ := os.Getwd()
	candidates := []string{
		filepath.Join(executableDir, "..", "share", "linux-wallpaperengine-gui", "frontend"),
		filepath.Join(cwd, "build", "frontend"),
		"/app/share/linux-wallpaperengine-gui/frontend",
		"/usr/share/linux-wallpaperengine-gui/frontend",
		"/usr/local/share/linux-wallpaperengine-gui/frontend",
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(filepath.Join(candidate, "index.html")); err == nil && !info.IsDir() {
			return candidate
		}
	}
	return ""
}

func Start() {
	processMu.Lock()
	if webviewProcess != nil {
		processMu.Unlock()
		return
	}
	processMu.Unlock()

	host, err := resolveHost()
	if err != nil {
		logger.Printf("Failed to find Qt WebEngine host: %v", err)
		return
	}

	conf, err := config.GetConfig()
	if err != nil {
		logger.Printf("Failed to read UI configuration: %v", err)
		conf = config.DefaultConfig
	}

	args := make([]string, 0, 8)
	if devURL := os.Getenv("LWE_GUI_DEV_URL"); devURL != "" {
		args = append(args, "--url", devURL)
	} else if frontendDir := resolveFrontendDir(); frontendDir != "" {
		args = append(args, "--frontend-dir", frontendDir)
	} else {
		logger.Println("Frontend build was not found; set LWE_GUI_FRONTEND_DIR or build the frontend first")
		return
	}

	if conf.TransparentUi {
		args = append(args, "--transparent")
	}
	if hasArg("--debug-mode") {
		args = append(args, "--debug-mode")
	}

	cmd := exec.Command(host, args...)
	cmd.Env = os.Environ()

	forceNativeWayland := hasArg("--native-wayland")
	if IsWaylandSession() {
		if forceNativeWayland || conf.NativeWayland {
			cmd.Env = append(cmd.Env, "QT_QPA_PLATFORM=wayland")
			logger.Println("Configuring Qt WebEngine host for native Wayland")
		} else {
			cmd.Env = append(cmd.Env, "QT_QPA_PLATFORM=xcb")
			logger.Println("Configuring Qt WebEngine host for XWayland")
		}
	}

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()
	logger.Printf("Starting Qt WebEngine UI: %s %s", host, strings.Join(args, " "))
	if err := cmd.Start(); err != nil {
		logger.Printf("Failed to start Qt WebEngine UI: %v", err)
		return
	}

	processMu.Lock()
	webviewProcess = cmd.Process
	processMu.Unlock()
	logger.Printf("Qt WebEngine UI started (PID: %d)", cmd.Process.Pid)

	logPipe := func(scanner *bufio.Scanner) {
		for scanner.Scan() {
			logger.UIHostLog(scanner.Text())
		}
	}
	go logPipe(bufio.NewScanner(stdout))
	go logPipe(bufio.NewScanner(stderr))

	go func() {
		err := cmd.Wait()
		logger.Printf("Qt WebEngine UI exited: %v", err)
		processMu.Lock()
		if webviewProcess == cmd.Process {
			webviewProcess = nil
		}
		processMu.Unlock()
	}()
}

func Stop() {
	processMu.Lock()
	process := webviewProcess
	webviewProcess = nil
	processMu.Unlock()
	if process == nil {
		return
	}
	logger.Println("Stopping Qt WebEngine UI...")
	if err := process.Kill(); err != nil {
		logger.Printf("Error stopping Qt WebEngine UI: %v", err)
	}
}
