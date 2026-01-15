package logger

import (
	"fmt"
	"log"
	"sync"
)

type LogEntry struct {
	Type    string
	Message string
}

var (
	listeners []chan LogEntry
	mu        sync.Mutex
)

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
	entry := LogEntry{Type: logType, Message: msg}
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
	log.Printf("[BACKEND] %s", msg)
	broadcast("backend", msg)
}

func Println(v ...interface{}) {
	msg := fmt.Sprint(v...)
	log.Printf("[BACKEND] %s", msg)
	broadcast("backend", msg)
}

func WallpaperLog(screen, msg string) {
	formatted := fmt.Sprintf("%s: %s", screen, msg)
	// We don't print wallpaper logs to backend console to avoid noise
	broadcast("wallpaper", formatted)
}

func Fatalf(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	log.Printf("[BACKEND] FATAL: %s", msg)
	broadcast("backend", "FATAL: "+msg)
	log.Fatal("[BACKEND] " + msg)
}

func Fatal(v ...interface{}) {
	msg := fmt.Sprint(v...)
	log.Printf("[BACKEND] FATAL: %s", msg)
	broadcast("backend", "FATAL: "+msg)
	log.Fatal("[BACKEND] " + msg)
}
