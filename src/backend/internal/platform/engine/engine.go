package engine

import (
	"context"
	"encoding/json"
	"os/exec"
	"strings"
	"sync"
	"time"

	"linux-wallpaperengine-gui/src/backend/internal/logger"
)

const defaultExecutable = "linux-wallpaperengine"

// probeTimeout bounds the --whoareyou probe so a stalled engine can't block wallpaper setup.
var probeTimeout = 1500 * time.Millisecond

const probeContextGrace = 500 * time.Millisecond

// Info describes the detected engine per the --whoareyou contract.
type Info struct {
	Name           string   `json:"name"`
	Implementation string   `json:"implementation"`
	Version        string   `json:"version"`
	ControlSocket  bool     `json:"control_socket"`
	Features       []string `json:"features"`
}

// Supports reports whether the engine advertises the given feature.
func (info Info) Supports(feature string) bool {
	for _, advertised := range info.Features {
		if advertised == feature {
			return true
		}
	}
	return false
}

// ResolveExecutable returns the custom executable, or the default via PATH.
func ResolveExecutable(custom string) string {
	if strings.TrimSpace(custom) != "" {
		return custom
	}
	return defaultExecutable
}

type detectionResult struct {
	info Info
	ok   bool
}

var (
	detectMutex sync.Mutex
	detectCache = make(map[string]detectionResult)
)

// Detect probes the executable with `--whoareyou`. Results are cached per path;
// timeout, non-zero exit or unparseable output means upstream.
func Detect(execPath string) (Info, bool) {
	detectMutex.Lock()
	defer detectMutex.Unlock()

	if result, cached := detectCache[execPath]; cached {
		return result.info, result.ok
	}

	info, ok := probe(execPath)
	detectCache[execPath] = detectionResult{info: info, ok: ok}

	if ok {
		logger.Printf("detected azpepoze linux-wallpaperengine")
	} else {
		logger.Printf("detected upstream linux-wallpaperengine")
	}

	return info, ok
}

func probe(execPath string) (Info, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), probeTimeout)
	defer cancel()

	command := exec.CommandContext(ctx, execPath, "--whoareyou")
	// WaitDelay lets Wait return even if a grandchild holds the pipe open.
	command.WaitDelay = probeContextGrace

	output, err := command.Output()
	if err != nil {
		return Info{}, false
	}

	line := firstJSONObjectLine(string(output))
	if line == "" {
		return Info{}, false
	}

	var info Info
	if err := json.Unmarshal([]byte(line), &info); err != nil {
		return Info{}, false
	}
	if info.Name == "" {
		return Info{}, false
	}

	return info, true
}

// firstJSONObjectLine returns the first stdout line holding a JSON object.
func firstJSONObjectLine(output string) string {
	for _, raw := range strings.Split(output, "\n") {
		line := strings.TrimSpace(raw)
		if strings.HasPrefix(line, "{") && json.Valid([]byte(line)) {
			return line
		}
	}
	return ""
}
