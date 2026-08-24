//go:build linux && cgo

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"

	"linux-wallpaperengine-gui/src/backend/internal/platform/steamworks"
)

type request struct {
	ID     int             `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type response struct {
	ID     int         `json:"id"`
	Result interface{} `json:"result,omitempty"`
	Error  string      `json:"error,omitempty"`
}

type detailsParams struct {
	IDs             []string `json:"ids"`
	LongDescription bool     `json:"long_description"`
}

type idParams struct {
	ID string `json:"id"`
}

func decodeParams(data json.RawMessage, target interface{}) error {
	if len(data) == 0 || string(data) == "null" {
		return nil
	}
	return json.Unmarshal(data, target)
}

func handle(req request) response {
	result := response{ID: req.ID}
	fail := func(err error) response {
		if err != nil {
			result.Error = err.Error()
		}
		return result
	}

	switch req.Method {
	case "ping":
		result.Result = "pong"
	case "available":
		result.Result = steamworks.Available()
	case "last-error":
		result.Result = steamworks.LastError()
	case "query":
		var params steamworks.QueryOptions
		if err := decodeParams(req.Params, &params); err != nil {
			return fail(err)
		}
		value, err := steamworks.Query(params)
		if err != nil {
			return fail(err)
		}
		result.Result = value
	case "details":
		var params detailsParams
		if err := decodeParams(req.Params, &params); err != nil {
			return fail(err)
		}
		value, err := steamworks.Details(params.IDs, params.LongDescription)
		if err != nil {
			return fail(err)
		}
		result.Result = value
	case "subscribe", "unsubscribe", "item-state", "download", "install":
		var params idParams
		if err := decodeParams(req.Params, &params); err != nil {
			return fail(err)
		}
		switch req.Method {
		case "subscribe":
			if err := steamworks.Subscribe(params.ID); err != nil {
				return fail(err)
			}
			result.Result = true
		case "unsubscribe":
			if err := steamworks.Unsubscribe(params.ID); err != nil {
				return fail(err)
			}
			result.Result = true
		case "item-state":
			value, err := steamworks.ItemState(params.ID)
			if err != nil {
				return fail(err)
			}
			result.Result = value
		case "download":
			value, err := steamworks.Download(params.ID)
			if err != nil {
				return fail(err)
			}
			result.Result = value
		case "install":
			value, err := steamworks.Install(params.ID)
			if err != nil {
				return fail(err)
			}
			result.Result = value
		}
	case "subscribed-items":
		value, err := steamworks.SubscribedItems()
		if err != nil {
			return fail(err)
		}
		result.Result = value
	case "shutdown":
		steamworks.Shutdown()
		result.Result = true
	default:
		result.Error = fmt.Sprintf("unknown Steamworks helper method: %s", req.Method)
	}
	return result
}

func main() {
	// The helper itself is already running inside the Steam Flatpak sandbox.
	// Force direct Steamworks calls to avoid recursively launching another helper.
	_ = os.Setenv("LWE_STEAM_PROVIDER", "native")
	defer steamworks.Shutdown()

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Buffer(make([]byte, 4096), 4*1024*1024)
	encoder := json.NewEncoder(os.Stdout)
	for scanner.Scan() {
		var req request
		if err := json.Unmarshal(scanner.Bytes(), &req); err != nil {
			_ = encoder.Encode(response{Error: err.Error()})
			continue
		}
		if err := encoder.Encode(handle(req)); err != nil {
			return
		}
		if req.Method == "shutdown" {
			return
		}
	}
}
