package notification

import (
	"os/exec"
)

// Notify sends a system notification with a specific level
func Notify(level, title, message string) {
	urgency := "normal"
	switch level {
	case "toast", "info":
		urgency = "low"
	case "warn":
		urgency = "normal"
	case "error", "critical":
		urgency = "critical"
	}
	exec.Command("notify-send", "-u", urgency, "-a", "Linux Wallpaper Engine", title, message).Run()
}

// Toast sends a low-priority notification
func Toast(title, message string) {
	Notify("toast", title, message)
}

// Warn sends a normal-priority notification
func Warn(title, message string) {
	Notify("warn", title, message)
}

// Error sends a high-priority/critical notification
func Error(title, message string) {
	Notify("error", title, message)
}

// Send is kept for compatibility with current calls, mapping to Error
func Send(title, message string) {
	Error(title, message)
}
