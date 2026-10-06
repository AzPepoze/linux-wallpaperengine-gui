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

// probeTimeout bounds the --whoareyou probe so an upstream engine that stalls on
// an unknown flag cannot block wallpaper application.
var probeTimeout = 1500 * time.Millisecond

const probeContextGrace = 500 * time.Millisecond

// Info describes the detected wallpaper engine, matching the frozen
// `--whoareyou` contract.
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

// ResolveExecutable returns the configured executable when set, otherwise the
// bare command name resolved through PATH.
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

// Detect probes the executable with `--whoareyou` and reports whether it is an
// AzPepoze engine. Results are cached per executable path, so a changed path is
// re-probed. A timeout, non-zero exit or unparseable output means upstream.
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
	// Ensure Wait returns even if a grandchild keeps the output pipe open after
	// the timed-out process is killed.
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

// firstJSONObjectLine returns the first stdout line that is a valid JSON
// object, skipping any log noise around it.
func firstJSONObjectLine(output string) string {
	for _, raw := range strings.Split(output, "\n") {
		line := strings.TrimSpace(raw)
		if strings.HasPrefix(line, "{") && json.Valid([]byte(line)) {
			return line
		}
	}
	return ""
}
