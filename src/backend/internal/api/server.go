package api

import (
	"encoding/json"
	"io"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"net"
	"os"
	"sync"
)

var (
	clients    []chan interface{}
	clientsMu  sync.Mutex
	socketPath string
)

func BroadcastEvent(method string, params interface{}) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	event := Event{Method: method, Params: params}
	for _, ch := range clients {
		select {
		case ch <- event:
		default:
			// Drop if channel is full
		}
	}
}

func StartServer(path string, cleanup func()) {
	socketPath = path
	if _, err := os.Stat(socketPath); err == nil {
		if err := os.Remove(socketPath); err != nil {
			logger.Error("Failed to remove existing socket file at %s: %v. Please check permissions or delete it manually.", socketPath, err)
		}
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		logger.Error("Failed to create socket listener at %s: %v. This usually happens if another instance is running or the path is not writable.", socketPath, err)
	}
	defer func() {
		if err := listener.Close(); err != nil {
			logger.Println("Error closing listener:", err)
		}
	}()

	logger.Printf("Listening on %s", socketPath)

	for {
		conn, err := listener.Accept()
		if err != nil {
			logger.Println("Accept error:", err)
			continue
		}
		go handleConnection(conn, cleanup)
	}
}

func handleConnection(conn net.Conn, cleanup func()) {
	defer func() {
		if err := conn.Close(); err != nil {
			logger.Println("Error closing connection:", err)
		}
	}()
	decoder := json.NewDecoder(conn)
	encoder := json.NewEncoder(conn)

	// Channel for all outgoing messages to this client
	outCh := make(chan interface{}, 100)

	clientsMu.Lock()
	clients = append(clients, outCh)
	clientsMu.Unlock()

	defer func() {
		clientsMu.Lock()
		for i, ch := range clients {
			if ch == outCh {
				clients = append(clients[:i], clients[i+1:]...)
				break
			}
		}
		clientsMu.Unlock()
	}()

	// Writing goroutine
	go func() {
		for msg := range outCh {
			if err := encoder.Encode(msg); err != nil {
				return
			}
		}
	}()

	// Subscribe to logs
	logCh := logger.Subscribe()
	go func() {
		for entry := range logCh {
			event := Event{
				Method: "log",
				Params: map[string]string{
					"type":    entry.Type,
					"message": entry.Message,
				},
			}
			select {
			case outCh <- event:
			default:
			}
		}
	}()

	for {
		var req Request
		if err := decoder.Decode(&req); err != nil {
			if err != io.EOF {
				logger.Println("Decode error:", err)
			}
			return
		}

		logger.Printf("Received: %s (ID: %d)", req.Method, req.ID)

		res := handleIPC(req, encoder, cleanup)

		if err := encoder.Encode(res); err != nil {
			logger.Println("Encode error:", err)
			return
		}
	}
}
