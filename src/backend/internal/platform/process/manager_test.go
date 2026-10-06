package process

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
	"time"
)

type activeSnapshot struct {
	cmd     *exec.Cmd
	command string
}

func writeTestScript(t *testing.T, body string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "fake-engine")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body+"\n"), 0755); err != nil {
		t.Fatalf("failed to write test script: %v", err)
	}
	return path
}

func desiredWallpaper(screen, execPath, fullCommand string) []struct {
	Screen  string
	Exec    string
	Args    []string
	Command string
} {
	return []struct {
		Screen  string
		Exec    string
		Args    []string
		Command string
	}{
		{Screen: screen, Exec: execPath, Command: fullCommand},
	}
}

func readActive(manager *Manager, screen string) (activeSnapshot, bool) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	active, exists := manager.activeWallpapers[screen]
	if !exists {
		return activeSnapshot{}, false
	}
	return activeSnapshot{cmd: active.Cmd, command: active.Command}, true
}

func killProcessGroup(command *exec.Cmd) {
	if command == nil || command.Process == nil {
		return
	}
	if processGroupID, err := syscall.Getpgid(command.Process.Pid); err == nil {
		_ = syscall.Kill(-processGroupID, syscall.SIGKILL)
		return
	}
	_ = command.Process.Kill()
}

func cleanupManager(t *testing.T, manager *Manager) {
	t.Helper()
	t.Cleanup(func() {
		manager.mutex.Lock()
		defer manager.mutex.Unlock()
		for screen, active := range manager.activeWallpapers {
			killProcessGroup(active.Cmd)
			delete(manager.activeWallpapers, screen)
		}
	})
}

func cleanupCommand(t *testing.T, command *exec.Cmd) {
	t.Helper()
	t.Cleanup(func() { killProcessGroup(command) })
}

func waitFor(t *testing.T, timeout time.Duration, condition func() bool) {
	t.Helper()

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("condition not met within %v", timeout)
}

func TestHandoffKeepsOwnerWhenCandidateExits(t *testing.T) {
	manager := NewManager()
	manager.SetControlSocketHandoff(true)
	cleanupManager(t, manager)

	ownerScript := writeTestScript(t, "exec sleep 30")
	manager.spawnWallpaper("HDMI-1", ownerScript, nil, "old-command")

	owner, exists := readActive(manager, "HDMI-1")
	if !exists {
		t.Fatalf("expected owner to be tracked")
	}
	cleanupCommand(t, owner.cmd)

	candidateScript := writeTestScript(t, "exit 0")
	manager.UpdateWallpapers(desiredWallpaper("HDMI-1", candidateScript, "new-command"))

	waitFor(t, 2*time.Second, func() bool {
		active, tracked := readActive(manager, "HDMI-1")
		return tracked && active.cmd == owner.cmd && active.command == "new-command"
	})
}

func TestHandoffPromotesCandidateThatOutlivesWindow(t *testing.T) {
	manager := NewManager()
	manager.SetControlSocketHandoff(true)
	manager.handoffTimeout = 200 * time.Millisecond
	cleanupManager(t, manager)

	ownerScript := writeTestScript(t, "exec sleep 30")
	manager.spawnWallpaper("HDMI-1", ownerScript, nil, "old-command")

	owner, exists := readActive(manager, "HDMI-1")
	if !exists {
		t.Fatalf("expected owner to be tracked")
	}
	cleanupCommand(t, owner.cmd)

	candidateScript := writeTestScript(t, "exec sleep 30")
	manager.UpdateWallpapers(desiredWallpaper("HDMI-1", candidateScript, "new-command"))

	waitFor(t, 3*time.Second, func() bool {
		active, tracked := readActive(manager, "HDMI-1")
		return tracked && active.cmd != owner.cmd && active.command == "new-command"
	})
}

func TestUpstreamRestartKillsAndReplacesOwner(t *testing.T) {
	manager := NewManager()
	cleanupManager(t, manager)

	ownerScript := writeTestScript(t, "exec sleep 30")
	manager.spawnWallpaper("HDMI-1", ownerScript, nil, "old-command")

	owner, exists := readActive(manager, "HDMI-1")
	if !exists {
		t.Fatalf("expected owner to be tracked")
	}

	newScript := writeTestScript(t, "exec sleep 30")
	manager.UpdateWallpapers(desiredWallpaper("HDMI-1", newScript, "new-command"))

	waitFor(t, 2*time.Second, func() bool {
		active, tracked := readActive(manager, "HDMI-1")
		return tracked && active.cmd != owner.cmd && active.command == "new-command"
	})

	waitFor(t, 2*time.Second, func() bool {
		return syscall.Kill(owner.cmd.Process.Pid, 0) != nil
	})
}
