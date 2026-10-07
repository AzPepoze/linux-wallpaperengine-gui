package engine

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func writeFakeEngine(t *testing.T, body string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "fake-linux-wallpaperengine")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body+"\n"), 0755); err != nil {
		t.Fatalf("failed to write fake engine: %v", err)
	}
	return path
}

func TestResolveExecutable(t *testing.T) {
	if got := ResolveExecutable(""); got != "linux-wallpaperengine" {
		t.Fatalf("expected default executable, got %q", got)
	}
	if got := ResolveExecutable("   "); got != "linux-wallpaperengine" {
		t.Fatalf("expected default executable for blank input, got %q", got)
	}
	if got := ResolveExecutable("/opt/engine/linux-wallpaperengine"); got != "/opt/engine/linux-wallpaperengine" {
		t.Fatalf("expected custom executable to be preserved, got %q", got)
	}
}

func TestDetectAzpepozeEngine(t *testing.T) {
	script := writeFakeEngine(t, `echo "starting up"
printf '%s\n' '{"name":"linux-wallpaperengine","implementation":"azpepoze","version":"9.9.9","control_socket":true,"features":["control-socket","transition","set-property","scaling","volume","fps"]}'
echo "trailing noise"`)

	info, ok := Detect(script)
	if !ok {
		t.Fatalf("expected azpepoze engine to be detected")
	}
	if info.Name != "linux-wallpaperengine" {
		t.Fatalf("unexpected name %q", info.Name)
	}
	if info.Implementation != "azpepoze" {
		t.Fatalf("unexpected implementation %q", info.Implementation)
	}
	if info.Version != "9.9.9" {
		t.Fatalf("unexpected version %q", info.Version)
	}
	if !info.ControlSocket {
		t.Fatalf("expected control_socket to be true")
	}
	if !info.Supports("control-socket") {
		t.Fatalf("expected control-socket feature to be supported")
	}
	if info.Supports("does-not-exist") {
		t.Fatalf("unexpected support for unknown feature")
	}
}

func TestDetectSkipsInvalidJSONLine(t *testing.T) {
	script := writeFakeEngine(t, `echo '{"name": "broken",}'
printf '%s\n' '{"name":"linux-wallpaperengine","implementation":"azpepoze","version":"1.0.0","control_socket":true,"features":["control-socket"]}'`)

	info, ok := Detect(script)
	if !ok {
		t.Fatalf("expected engine to be detected after invalid JSON line")
	}
	if info.Version != "1.0.0" {
		t.Fatalf("unexpected version %q", info.Version)
	}
}

func TestDetectGarbageFallsBackToUpstream(t *testing.T) {
	script := writeFakeEngine(t, `echo "not json at all"`)

	if info, ok := Detect(script); ok {
		t.Fatalf("expected upstream fallback, got %+v", info)
	}
}

func TestDetectNonZeroExitFallsBackToUpstream(t *testing.T) {
	script := writeFakeEngine(t, `exit 1`)

	if info, ok := Detect(script); ok {
		t.Fatalf("expected upstream fallback on non-zero exit, got %+v", info)
	}
}

func TestDetectHangTimesOutAndFallsBack(t *testing.T) {
	previousTimeout := probeTimeout
	probeTimeout = 250 * time.Millisecond
	t.Cleanup(func() { probeTimeout = previousTimeout })

	script := writeFakeEngine(t, `exec sleep 10`)

	start := time.Now()
	if info, ok := Detect(script); ok {
		t.Fatalf("expected upstream fallback on timeout, got %+v", info)
	}
	if elapsed := time.Since(start); elapsed > 3*time.Second {
		t.Fatalf("detection took too long to time out: %v", elapsed)
	}
}
