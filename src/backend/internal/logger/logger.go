package logger

import (
	"fmt"
	"log"
	"regexp"
	"sync"

	"linux-wallpaperengine-gui/src/backend/internal/platform/notification"
)

const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorPurple = "\033[35m"
	colorCyan   = "\033[36m"
	colorWhite  = "\033[37m"
)

var ansiRegex = regexp.MustCompile("\033\\[[0-9;]*m")
var frontendLogRegex = regexp.MustCompile(`^\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2} \[(ELECTRON|BACKEND|FRONTEND|WALLPAPER)\] `)

type LogEntry struct {
	Type    string
	Message string
}

var (
	listeners []chan LogEntry
	mu        sync.Mutex
)

func stripANSI(text string) string {
	return ansiRegex.ReplaceAllString(text, "")
}

func Subscribe() chan LogEntry {
	mu.Lock()
	defer mu.Unlock()
	ch := make(chan LogEntry, 100)
	listeners = append(listeners, ch)
	return ch
}

func broadcast(logType, msg string) {
	mu.Lock()
	defer mu.Unlock()
	entry := LogEntry{Type: logType, Message: stripANSI(msg)}
	for _, ch := range listeners {
		select {
		case ch <- entry:
		default:
			// Drop if channel is full
		}
	}
}

func Printf(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	log.Printf("%s[BACKEND]%s %s", colorGreen, colorReset, msg)
	broadcast("backend", msg)
}

func Println(v ...interface{}) {
	msg := fmt.Sprint(v...)
	log.Printf("%s[BACKEND]%s %s", colorGreen, colorReset, msg)
	broadcast("backend", msg)
}

func WallpaperLog(screen, msg string) {
	formatted := fmt.Sprintf("%s%s: %s%s", colorCyan, screen, msg, colorReset)
	// We don't print wallpaper logs to backend console to avoid noise
	broadcast("wallpaper", formatted)
}

func ElectronLog(msg string) {
	// Strip redundant frontend timestamps and prefixes
	msg = frontendLogRegex.ReplaceAllString(msg, "")
	log.Printf("%s[ELECTRON]%s %s", colorBlue, colorReset, msg)
	broadcast("electron", msg)
}

func Error(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	log.Printf("%s[BACKEND] FATAL: %s%s", colorRed, msg, colorReset)
	broadcast("backend", "FATAL: "+msg)
	notification.Error("Linux Wallpaper Engine GUI [BACKEND] - Fatal Error", msg)
	log.Fatal(colorRed + "[BACKEND] " + msg + colorReset)
}
