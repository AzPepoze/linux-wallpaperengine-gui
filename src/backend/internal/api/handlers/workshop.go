package handlers

import (
	"encoding/json"
	"fmt"

	"linux-wallpaperengine-gui/src/backend/internal/api/models"
	"linux-wallpaperengine-gui/src/backend/internal/logger"
	"linux-wallpaperengine-gui/src/backend/internal/platform/steamworks"
)

type workshopIDsParams struct {
	FileIDs []string `json:"fileIds"`
}

type workshopIDParams struct {
	FileID string `json:"fileId"`
	UGCID  string `json:"ugcId"`
}

func workshopError(request models.Request, err error) models.Response {
	logger.Printf("Workshop %s failed: %v", request.Method, err)
	return models.Response{ID: request.ID, Error: err.Error()}
}

func (handler *Handler) HandleWorkshop(request models.Request) models.Response {
	response := models.Response{ID: request.ID}

	switch request.Method {
	case "is-steam-running":
		response.Result = steamworks.Available()
		return response

	case "get-published-file-details":
		var params workshopIDsParams
		if err := json.Unmarshal(request.Params, &params); err != nil {
			return workshopError(request, err)
		}
		items, err := steamworks.Details(params.FileIDs, false)
		if err != nil {
			return workshopError(request, err)
		}
		response.Result = items
		return response

	case "get-ugc-file-details":
		var params workshopIDParams
		if err := json.Unmarshal(request.Params, &params); err != nil {
			return workshopError(request, err)
		}
		if params.UGCID == "" {
			return workshopError(request, fmt.Errorf("UGC ID is required"))
		}
		items, err := steamworks.Details([]string{params.UGCID}, true)
		if err != nil {
			return workshopError(request, err)
		}
		if len(items) == 0 {
			response.Result = nil
		} else {
			response.Result = items[0]
		}
		return response

	case "query-workshop-files":
		var options steamworks.QueryOptions
		if len(request.Params) > 0 && string(request.Params) != "null" {
			if err := json.Unmarshal(request.Params, &options); err != nil {
				return workshopError(request, err)
			}
		}
		if options.Page <= 0 {
			options.Page = 1
		}
		if options.NumPerPage <= 0 {
			options.NumPerPage = 50
		}
		requestedQueryType := options.QueryType
		requestedItemType := options.ItemType
		if requestedQueryType == 0 {
			requestedQueryType = 13
		}
		if requestedItemType == 0 {
			requestedItemType = 13
		}

		queryTypes := uniqueInts(requestedQueryType, 13, 1, 2, 9)
		itemTypes := uniqueInts(requestedItemType, 13, 0)
		steamPagesPerFrontendPage := (options.NumPerPage + 49) / 50
		startingSteamPage := (options.Page-1)*steamPagesPerFrontendPage + 1

		var chosenQueryType, chosenItemType int
		var merged []map[string]interface{}
		total := 0
		found := false
		for _, queryType := range queryTypes {
			for _, itemType := range itemTypes {
				candidate := options
				candidate.QueryType = queryType
				candidate.ItemType = itemType
				candidate.Page = startingSteamPage
				candidate.NumPerPage = 50
				result, err := steamworks.Query(candidate)
				if err != nil {
					logger.Printf("Workshop query failed (queryType=%d itemType=%d): %v", queryType, itemType, err)
					continue
				}
				if len(result.Items) > 0 || result.Total > 0 {
					chosenQueryType, chosenItemType = queryType, itemType
					merged = append(merged, result.Items...)
					total = result.Total
					found = true
					break
				}
			}
			if found {
				break
			}
		}

		if found {
			for pageOffset := 1; pageOffset < steamPagesPerFrontendPage && len(merged) < options.NumPerPage; pageOffset++ {
				candidate := options
				candidate.QueryType = chosenQueryType
				candidate.ItemType = chosenItemType
				candidate.Page = startingSteamPage + pageOffset
				candidate.NumPerPage = 50
				result, err := steamworks.Query(candidate)
				if err != nil {
					logger.Printf("Workshop multi-page query failed at Steam page %d: %v", candidate.Page, err)
					break
				}
				merged = append(merged, result.Items...)
				if total > 0 && len(merged) >= total {
					break
				}
			}
		}
		if len(merged) > options.NumPerPage {
			merged = merged[:options.NumPerPage]
		}
		response.Result = map[string]interface{}{"items": merged, "total": total, "nextCursor": nil}
		return response

	case "subscribe-workshop-item", "unsubscribe-workshop-item":
		var params workshopIDParams
		if err := json.Unmarshal(request.Params, &params); err != nil {
			return workshopError(request, err)
		}
		if params.FileID == "" {
			return workshopError(request, fmt.Errorf("file ID is required"))
		}
		var err error
		if request.Method == "subscribe-workshop-item" {
			err = steamworks.Subscribe(params.FileID)
		} else {
			err = steamworks.Unsubscribe(params.FileID)
		}
		if err != nil {
			return workshopError(request, err)
		}
		response.Result = map[string]bool{"success": true}
		return response

	case "get-subscribed-items":
		items, err := steamworks.SubscribedItems()
		if err != nil {
			return workshopError(request, err)
		}
		response.Result = items
		return response

	case "get-workshop-item-download-info":
		var params workshopIDParams
		if err := json.Unmarshal(request.Params, &params); err != nil {
			return workshopError(request, err)
		}
		info, err := steamworks.Download(params.FileID)
		if err != nil {
			return workshopError(request, err)
		}
		response.Result = info
		return response

	case "get-workshop-item-install-info":
		var params workshopIDParams
		if err := json.Unmarshal(request.Params, &params); err != nil {
			return workshopError(request, err)
		}
		info, err := steamworks.Install(params.FileID)
		if err != nil {
			return workshopError(request, err)
		}
		response.Result = info
		return response

	case "get-all-downloading-items":
		items, err := steamworks.SubscribedItems()
		if err != nil {
			return workshopError(request, err)
		}
		downloading := make([]map[string]interface{}, 0)
		for _, fileID := range items {
			state, err := steamworks.ItemState(fileID)
			if err != nil || state&(16|32) == 0 {
				continue
			}
			info, err := steamworks.Download(fileID)
			if err != nil || info == nil {
				continue
			}
			downloading = append(downloading, map[string]interface{}{
				"fileId": fileID,
				"current": info.Current,
				"total": info.Total,
				"state": state,
			})
		}
		response.Result = downloading
		return response
	}

	return models.Response{ID: request.ID, Error: fmt.Sprintf("unknown Workshop method: %s", request.Method)}
}

func uniqueInts(values ...int) []int {
	result := make([]int, 0, len(values))
	seen := make(map[int]struct{}, len(values))
	for _, value := range values {
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
