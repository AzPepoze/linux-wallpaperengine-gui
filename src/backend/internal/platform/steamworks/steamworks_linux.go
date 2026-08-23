//go:build linux && cgo

package steamworks

/*
#cgo CXXFLAGS: -std=c++20
#cgo LDFLAGS: -ldl -lstdc++
#include <stdlib.h>
#include "bridge.h"
*/
import "C"

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"sync"
	"unsafe"
)

const wallpaperEngineAppID = 431960

var mu sync.Mutex

type QueryOptions struct {
	QueryType    int      `json:"query_type"`
	ItemType     int      `json:"item_type"`
	Page         int      `json:"page"`
	NumPerPage   int      `json:"numperpage"`
	RequiredTags []string `json:"requiredtags"`
	ExcludedTags []string `json:"excludedtags"`
	MatchAllTags bool     `json:"match_all_tags"`
	SearchText   string   `json:"search_text"`
}

type QueryResult struct {
	Items      []map[string]interface{} `json:"items"`
	Total      int                      `json:"total"`
	NextCursor string                   `json:"nextCursor"`
}

type DownloadInfo struct {
	Current string `json:"current"`
	Total   string `json:"total"`
}

type InstallInfo struct {
	SizeOnDisk string `json:"sizeOnDisk"`
	Folder     string `json:"folder"`
	Timestamp  uint32 `json:"timestamp"`
}

func bridgeError() error {
	message := C.GoString(C.lwe_steam_last_error())
	if message == "" {
		message = "Steamworks is unavailable"
	}
	return errors.New(message)
}

func ensure() error {
	if C.lwe_steam_available() != 0 {
		return nil
	}
	if C.lwe_steam_init(C.uint32_t(wallpaperEngineAppID)) == 0 {
		return bridgeError()
	}
	return nil
}

func Available() bool {
	mu.Lock()
	defer mu.Unlock()
	return ensure() == nil
}

func LastError() string {
	mu.Lock()
	defer mu.Unlock()
	return C.GoString(C.lwe_steam_last_error())
}

func cString(value string) (*C.char, func()) {
	ptr := C.CString(value)
	return ptr, func() { C.free(unsafe.Pointer(ptr)) }
}

func takeJSON(ptr *C.char, target interface{}) error {
	if ptr == nil {
		return bridgeError()
	}
	defer C.lwe_steam_free(ptr)
	return json.Unmarshal([]byte(C.GoString(ptr)), target)
}

func Query(options QueryOptions) (QueryResult, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return QueryResult{}, err
	}
	page := options.Page
	if page <= 0 {
		page = 1
	}

	search, freeSearch := cString(options.SearchText)
	defer freeSearch()
	required, freeRequired := cString(strings.Join(options.RequiredTags, "\n"))
	defer freeRequired()
	excluded, freeExcluded := cString(strings.Join(options.ExcludedTags, "\n"))
	defer freeExcluded()

	matchAny := C.int(1)
	if options.MatchAllTags {
		matchAny = 0
	}
	ptr := C.lwe_steam_query_json(
		C.int(options.QueryType), C.int(options.ItemType), C.uint32_t(page),
		search, required, excluded, matchAny, 0,
	)
	var result QueryResult
	if err := takeJSON(ptr, &result); err != nil {
		return QueryResult{}, err
	}
	if options.NumPerPage > 0 && len(result.Items) > options.NumPerPage {
		result.Items = result.Items[:options.NumPerPage]
	}
	return result, nil
}

func Details(ids []string, longDescription bool) ([]map[string]interface{}, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []map[string]interface{}{}, nil
	}
	values := make([]C.uint64_t, 0, len(ids))
	for _, id := range ids {
		value, err := strconv.ParseUint(id, 10, 64)
		if err != nil {
			return nil, err
		}
		values = append(values, C.uint64_t(value))
	}
	long := C.int(0)
	if longDescription {
		long = 1
	}
	ptr := C.lwe_steam_details_json((*C.uint64_t)(unsafe.Pointer(&values[0])), C.uint32_t(len(values)), long)
	var result []map[string]interface{}
	if err := takeJSON(ptr, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func Subscribe(id string) error {
	return subscriptionCall(id, true)
}

func Unsubscribe(id string) error {
	return subscriptionCall(id, false)
}

func subscriptionCall(id string, subscribe bool) error {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return err
	}
	value, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return err
	}
	var ok C.int
	if subscribe {
		ok = C.int(C.lwe_steam_subscribe(C.uint64_t(value)))
	} else {
		ok = C.int(C.lwe_steam_unsubscribe(C.uint64_t(value)))
	}
	if ok == 0 {
		return bridgeError()
	}
	return nil
}

func ItemState(id string) (uint32, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return 0, err
	}
	value, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint32(C.lwe_steam_item_state(C.uint64_t(value))), nil
}

func SubscribedItems() ([]string, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return nil, err
	}
	ptr := C.lwe_steam_subscribed_json()
	var result []string
	if err := takeJSON(ptr, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func Download(id string) (*DownloadInfo, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return nil, err
	}
	value, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return nil, err
	}
	ptr := C.lwe_steam_download_info_json(C.uint64_t(value))
	if ptr == nil {
		return nil, nil
	}
	var result DownloadInfo
	if err := takeJSON(ptr, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func Install(id string) (*InstallInfo, error) {
	mu.Lock()
	defer mu.Unlock()
	if err := ensure(); err != nil {
		return nil, err
	}
	value, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return nil, err
	}
	ptr := C.lwe_steam_install_info_json(C.uint64_t(value))
	if ptr == nil {
		return nil, nil
	}
	var result InstallInfo
	if err := takeJSON(ptr, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func Shutdown() {
	mu.Lock()
	defer mu.Unlock()
	C.lwe_steam_shutdown()
}
