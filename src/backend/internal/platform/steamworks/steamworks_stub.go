//go:build !linux || !cgo

package steamworks

import "errors"

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

var unavailable = errors.New("Steamworks integration requires Linux with cgo and libsteam_api.so")

func Available() bool { return false }
func LastError() string { return unavailable.Error() }
func Query(QueryOptions) (QueryResult, error) { return QueryResult{}, unavailable }
func Details([]string, bool) ([]map[string]interface{}, error) { return nil, unavailable }
func Subscribe(string) error { return unavailable }
func Unsubscribe(string) error { return unavailable }
func ItemState(string) (uint32, error) { return 0, unavailable }
func SubscribedItems() ([]string, error) { return nil, unavailable }
func Download(string) (*DownloadInfo, error) { return nil, unavailable }
func Install(string) (*InstallInfo, error) { return nil, unavailable }
func Shutdown() {}
