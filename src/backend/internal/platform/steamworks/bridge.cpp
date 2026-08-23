#include "bridge.h"

#include <dlfcn.h>

#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

namespace {
constexpr int kSteamUGCQueryCompletedCallback = 3401;
constexpr uint64_t kInvalidQueryHandle = UINT64_MAX;
constexpr uint32_t kWallpaperEngineAppId = 431960;
constexpr size_t kTitleMax = 129;
constexpr size_t kDescriptionMax = 8000;
constexpr size_t kTagListMax = 1025;
constexpr size_t kFilenameMax = 260;
constexpr size_t kUrlMax = 256;

#pragma pack(push, 4)
struct SteamUGCDetails {
    uint64_t publishedFileId;
    int32_t result;
    int32_t fileType;
    uint32_t creatorAppId;
    uint32_t consumerAppId;
    char title[kTitleMax];
    char description[kDescriptionMax];
    uint64_t steamIdOwner;
    uint32_t timeCreated;
    uint32_t timeUpdated;
    uint32_t timeAddedToUserList;
    int32_t visibility;
    bool banned;
    bool acceptedForUse;
    bool tagsTruncated;
    char tags[kTagListMax];
    uint64_t fileHandle;
    uint64_t previewFileHandle;
    char fileName[kFilenameMax];
    int32_t fileSize;
    int32_t previewFileSize;
    char url[kUrlMax];
    uint32_t votesUp;
    uint32_t votesDown;
    float score;
    uint32_t numChildren;
    uint64_t totalFilesSize;
};

struct SteamUGCQueryCompleted {
    uint64_t handle;
    int32_t result;
    uint32_t numResultsReturned;
    uint32_t totalMatchingResults;
    bool cachedData;
    char nextCursor[kUrlMax];
};
#pragma pack(pop)

using InitFn = bool (*)();
using ShutdownFn = void (*)();
using IsSteamRunningFn = bool (*)();
using RunCallbacksFn = void (*)();
using InterfaceFn = void *(*)();
using IsAPICallCompletedFn = bool (*)(void *, uint64_t, bool *);
using GetAPICallResultFn = bool (*)(void *, uint64_t, void *, int, int, bool *);

using CreateQueryAllFn = uint64_t (*)(void *, int, int, uint32_t, uint32_t, uint32_t);
using CreateDetailsQueryFn = uint64_t (*)(void *, uint64_t *, uint32_t);
using SendQueryFn = uint64_t (*)(void *, uint64_t);
using GetQueryResultFn = bool (*)(void *, uint64_t, uint32_t, SteamUGCDetails *);
using GetPreviewUrlFn = bool (*)(void *, uint64_t, uint32_t, char *, uint32_t);
using GetStatisticFn = bool (*)(void *, uint64_t, uint32_t, int, uint64_t *);
using ReleaseQueryFn = bool (*)(void *, uint64_t);
using AddTagFn = bool (*)(void *, uint64_t, const char *);
using SetBoolQueryFn = bool (*)(void *, uint64_t, bool);
using SetSearchTextFn = bool (*)(void *, uint64_t, const char *);
using SetCachedFn = bool (*)(void *, uint64_t, uint32_t);

using SubscribeFn = uint64_t (*)(void *, uint64_t);
using GetNumSubscribedFn = uint32_t (*)(void *, bool);
using GetSubscribedFn = uint32_t (*)(void *, uint64_t *, uint32_t, bool);
using GetItemStateFn = uint32_t (*)(void *, uint64_t);
using GetInstallInfoFn = bool (*)(void *, uint64_t, uint64_t *, char *, uint32_t, uint32_t *);
using GetDownloadInfoFn = bool (*)(void *, uint64_t, uint64_t *, uint64_t *);

struct Api {
    void *library = nullptr;
    void *ugc = nullptr;
    void *utils = nullptr;
    uint32_t appId = kWallpaperEngineAppId;

    InitFn init = nullptr;
    ShutdownFn shutdown = nullptr;
    IsSteamRunningFn isSteamRunning = nullptr;
    RunCallbacksFn runCallbacks = nullptr;
    IsAPICallCompletedFn isCallCompleted = nullptr;
    GetAPICallResultFn getCallResult = nullptr;

    CreateQueryAllFn createQueryAll = nullptr;
    CreateDetailsQueryFn createDetailsQuery = nullptr;
    SendQueryFn sendQuery = nullptr;
    GetQueryResultFn getQueryResult = nullptr;
    GetPreviewUrlFn getPreviewUrl = nullptr;
    GetStatisticFn getStatistic = nullptr;
    ReleaseQueryFn releaseQuery = nullptr;
    AddTagFn addRequiredTag = nullptr;
    AddTagFn addExcludedTag = nullptr;
    SetBoolQueryFn setMatchAnyTag = nullptr;
    SetBoolQueryFn setReturnMetadata = nullptr;
    SetBoolQueryFn setReturnAdditionalPreviews = nullptr;
    SetBoolQueryFn setReturnLongDescription = nullptr;
    SetSearchTextFn setSearchText = nullptr;
    SetCachedFn setAllowCachedResponse = nullptr;

    SubscribeFn subscribe = nullptr;
    SubscribeFn unsubscribe = nullptr;
    GetNumSubscribedFn getNumSubscribed = nullptr;
    GetSubscribedFn getSubscribed = nullptr;
    GetItemStateFn getItemState = nullptr;
    GetInstallInfoFn getInstallInfo = nullptr;
    GetDownloadInfoFn getDownloadInfo = nullptr;
};

Api api;
std::mutex apiMutex;
std::string lastError;

template <typename T>
T symbol(const char *name) {
    return reinterpret_cast<T>(dlsym(api.library, name));
}

void setError(const std::string &message) {
    lastError = message;
}

bool loadCoreSymbols() {
    api.init = symbol<InitFn>("SteamAPI_Init");
    api.shutdown = symbol<ShutdownFn>("SteamAPI_Shutdown");
    api.isSteamRunning = symbol<IsSteamRunningFn>("SteamAPI_IsSteamRunning");
    api.runCallbacks = symbol<RunCallbacksFn>("SteamAPI_RunCallbacks");
    if (!api.init || !api.shutdown || !api.isSteamRunning || !api.runCallbacks) {
        setError("Steamworks core symbols are incomplete");
        return false;
    }
    return true;
}

bool loadRuntimeSymbols() {
#define LOAD_REQUIRED(field, type, name) \
    api.field = symbol<type>(name); \
    if (!api.field) { setError(std::string("Steamworks symbol missing: ") + name); return false; }

    InterfaceFn ugcAccessor = symbol<InterfaceFn>("SteamAPI_SteamUGC_v021");
    if (!ugcAccessor) ugcAccessor = symbol<InterfaceFn>("SteamAPI_SteamUGC_v020");
    if (!ugcAccessor) { setError("Steamworks UGC v020/v021 interface is unavailable"); return false; }
    InterfaceFn utilsAccessor = symbol<InterfaceFn>("SteamAPI_SteamUtils_v011");
    if (!utilsAccessor) utilsAccessor = symbol<InterfaceFn>("SteamAPI_SteamUtils_v010");
    if (!utilsAccessor) { setError("Steamworks Utils v010/v011 interface is unavailable"); return false; }

    LOAD_REQUIRED(isCallCompleted, IsAPICallCompletedFn, "SteamAPI_ISteamUtils_IsAPICallCompleted");
    LOAD_REQUIRED(getCallResult, GetAPICallResultFn, "SteamAPI_ISteamUtils_GetAPICallResult");
    LOAD_REQUIRED(createQueryAll, CreateQueryAllFn, "SteamAPI_ISteamUGC_CreateQueryAllUGCRequestPage");
    LOAD_REQUIRED(createDetailsQuery, CreateDetailsQueryFn, "SteamAPI_ISteamUGC_CreateQueryUGCDetailsRequest");
    LOAD_REQUIRED(sendQuery, SendQueryFn, "SteamAPI_ISteamUGC_SendQueryUGCRequest");
    LOAD_REQUIRED(getQueryResult, GetQueryResultFn, "SteamAPI_ISteamUGC_GetQueryUGCResult");
    LOAD_REQUIRED(getPreviewUrl, GetPreviewUrlFn, "SteamAPI_ISteamUGC_GetQueryUGCPreviewURL");
    LOAD_REQUIRED(getStatistic, GetStatisticFn, "SteamAPI_ISteamUGC_GetQueryUGCStatistic");
    LOAD_REQUIRED(releaseQuery, ReleaseQueryFn, "SteamAPI_ISteamUGC_ReleaseQueryUGCRequest");
    LOAD_REQUIRED(addRequiredTag, AddTagFn, "SteamAPI_ISteamUGC_AddRequiredTag");
    LOAD_REQUIRED(addExcludedTag, AddTagFn, "SteamAPI_ISteamUGC_AddExcludedTag");
    LOAD_REQUIRED(setMatchAnyTag, SetBoolQueryFn, "SteamAPI_ISteamUGC_SetMatchAnyTag");
    LOAD_REQUIRED(setReturnMetadata, SetBoolQueryFn, "SteamAPI_ISteamUGC_SetReturnMetadata");
    LOAD_REQUIRED(setReturnAdditionalPreviews, SetBoolQueryFn, "SteamAPI_ISteamUGC_SetReturnAdditionalPreviews");
    LOAD_REQUIRED(setReturnLongDescription, SetBoolQueryFn, "SteamAPI_ISteamUGC_SetReturnLongDescription");
    LOAD_REQUIRED(setSearchText, SetSearchTextFn, "SteamAPI_ISteamUGC_SetSearchText");
    LOAD_REQUIRED(setAllowCachedResponse, SetCachedFn, "SteamAPI_ISteamUGC_SetAllowCachedResponse");
    LOAD_REQUIRED(subscribe, SubscribeFn, "SteamAPI_ISteamUGC_SubscribeItem");
    LOAD_REQUIRED(unsubscribe, SubscribeFn, "SteamAPI_ISteamUGC_UnsubscribeItem");
    LOAD_REQUIRED(getNumSubscribed, GetNumSubscribedFn, "SteamAPI_ISteamUGC_GetNumSubscribedItems");
    LOAD_REQUIRED(getSubscribed, GetSubscribedFn, "SteamAPI_ISteamUGC_GetSubscribedItems");
    LOAD_REQUIRED(getItemState, GetItemStateFn, "SteamAPI_ISteamUGC_GetItemState");
    LOAD_REQUIRED(getInstallInfo, GetInstallInfoFn, "SteamAPI_ISteamUGC_GetItemInstallInfo");
    LOAD_REQUIRED(getDownloadInfo, GetDownloadInfoFn, "SteamAPI_ISteamUGC_GetItemDownloadInfo");
#undef LOAD_REQUIRED

    api.ugc = ugcAccessor();
    api.utils = utilsAccessor();
    if (!api.ugc || !api.utils) {
        setError("Steamworks returned a null UGC/Utils interface after initialization");
        return false;
    }
    return true;
}

std::string jsonEscape(const char *value) {
    if (!value) return {};
    std::ostringstream out;
    for (const unsigned char ch : std::string(value)) {
        switch (ch) {
            case '\\': out << "\\\\"; break;
            case '"': out << "\\\""; break;
            case '\b': out << "\\b"; break;
            case '\f': out << "\\f"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (ch < 0x20) {
                    const char hex[] = "0123456789abcdef";
                    out << "\\u00" << hex[ch >> 4] << hex[ch & 15];
                } else {
                    out << static_cast<char>(ch);
                }
        }
    }
    return out.str();
}

std::vector<std::string> splitTags(const char *value) {
    std::vector<std::string> result;
    if (!value || !*value) return result;
    std::string source(value);
    size_t start = 0;
    while (start <= source.size()) {
        const size_t end = source.find('\n', start);
        const std::string tag = source.substr(start, end == std::string::npos ? std::string::npos : end - start);
        if (!tag.empty()) result.push_back(tag);
        if (end == std::string::npos) break;
        start = end + 1;
    }
    return result;
}

std::string tagsJson(const char *tags) {
    std::ostringstream out;
    out << '[';
    bool first = true;
    std::string source(tags ? tags : "");
    size_t start = 0;
    while (start <= source.size()) {
        const size_t end = source.find(',', start);
        const std::string tag = source.substr(start, end == std::string::npos ? std::string::npos : end - start);
        if (!tag.empty()) {
            if (!first) out << ',';
            first = false;
            out << '"' << jsonEscape(tag.c_str()) << '"';
        }
        if (end == std::string::npos) break;
        start = end + 1;
    }
    out << ']';
    return out.str();
}

char *copyResult(const std::string &value) {
    char *result = static_cast<char *>(std::malloc(value.size() + 1));
    if (!result) return nullptr;
    std::memcpy(result, value.c_str(), value.size() + 1);
    return result;
}

std::vector<std::string> libraryCandidates() {
    std::vector<std::string> candidates;
    if (const char *custom = std::getenv("LWE_STEAM_API_LIBRARY"); custom && *custom) candidates.emplace_back(custom);
    candidates.emplace_back("libsteam_api.so");
    candidates.emplace_back("libsteam_api64.so");

    const char *home = std::getenv("HOME");
    if (home && *home) {
        const std::filesystem::path root(home);
        const std::vector<std::filesystem::path> known = {
            root / ".local/share/Steam/libsteam_api.so",
            root / ".local/share/Steam/libsteam_api64.so",
            root / ".steam/steam/libsteam_api.so",
            root / ".steam/root/libsteam_api.so",
            root / ".var/app/com.valvesoftware.Steam/.local/share/Steam/libsteam_api.so",
        };
        for (const auto &path : known) candidates.push_back(path.string());
    }
    return candidates;
}

bool waitForCall(uint64_t call, SteamUGCQueryCompleted &completed) {
    if (!call) {
        setError("Steamworks returned an invalid async call handle");
        return false;
    }

    const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(20);
    while (std::chrono::steady_clock::now() < deadline) {
        api.runCallbacks();
        bool failed = false;
        if (api.isCallCompleted(api.utils, call, &failed)) {
            if (failed) {
                setError("Steamworks async call failed");
                return false;
            }
            bool resultFailed = false;
            if (!api.getCallResult(api.utils, call, &completed, sizeof(completed), kSteamUGCQueryCompletedCallback, &resultFailed) || resultFailed) {
                setError("Steamworks query result could not be decoded");
                return false;
            }
            if (completed.result != 1) {
                setError("Steamworks query returned EResult " + std::to_string(completed.result));
                return false;
            }
            return true;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    setError("Steamworks query timed out");
    return false;
}

std::string itemJson(uint64_t handle, uint32_t index, const SteamUGCDetails &details) {
    char preview[kUrlMax]{};
    api.getPreviewUrl(api.ugc, handle, index, preview, sizeof(preview));

    uint64_t subscriptions = 0;
    uint64_t favorites = 0;
    uint64_t views = 0;
    api.getStatistic(api.ugc, handle, index, 0, &subscriptions);
    api.getStatistic(api.ugc, handle, index, 1, &favorites);
    api.getStatistic(api.ugc, handle, index, 6, &views);

    std::ostringstream out;
    out << '{'
        << "\"publishedfileid\":\"" << details.publishedFileId << "\","
        << "\"publishedFileId\":\"" << details.publishedFileId << "\","
        << "\"result\":1,"
        << "\"title\":\"" << jsonEscape(details.title) << "\","
        << "\"description\":\"" << jsonEscape(details.description) << "\","
        << "\"preview_url\":\"" << jsonEscape(preview) << "\","
        << "\"previewUrl\":\"" << jsonEscape(preview) << "\","
        << "\"image\":\"" << jsonEscape(preview) << "\","
        << "\"time_created\":" << details.timeCreated << ','
        << "\"time_updated\":" << details.timeUpdated << ','
        << "\"timeCreated\":" << details.timeCreated << ','
        << "\"timeUpdated\":" << details.timeUpdated << ','
        << "\"subscriptions\":" << subscriptions << ','
        << "\"favorites\":" << favorites << ','
        << "\"views\":" << views << ','
        << "\"fileSize\":" << details.totalFilesSize << ','
        << "\"tags\":" << tagsJson(details.tags)
        << '}';
    return out.str();
}

std::string collectQuery(uint64_t handle, const SteamUGCQueryCompleted &completed) {
    std::ostringstream out;
    out << "{\"items\":[";
    bool first = true;
    for (uint32_t i = 0; i < completed.numResultsReturned; ++i) {
        SteamUGCDetails details{};
        if (!api.getQueryResult(api.ugc, handle, i, &details) || details.result != 1) continue;
        if (!first) out << ',';
        first = false;
        out << itemJson(handle, i, details);
    }
    out << "],\"total\":" << completed.totalMatchingResults
        << ",\"nextCursor\":\"" << jsonEscape(completed.nextCursor) << "\"}";
    return out.str();
}

void applyQueryOptions(uint64_t handle, const char *searchText, const char *requiredTags,
                       const char *excludedTags, int matchAnyTag, int longDescription) {
    for (const auto &tag : splitTags(requiredTags)) api.addRequiredTag(api.ugc, handle, tag.c_str());
    for (const auto &tag : splitTags(excludedTags)) api.addExcludedTag(api.ugc, handle, tag.c_str());
    api.setMatchAnyTag(api.ugc, handle, matchAnyTag != 0);
    api.setReturnMetadata(api.ugc, handle, true);
    api.setReturnAdditionalPreviews(api.ugc, handle, true);
    api.setReturnLongDescription(api.ugc, handle, longDescription != 0);
    api.setAllowCachedResponse(api.ugc, handle, 0);
    if (searchText && *searchText) api.setSearchText(api.ugc, handle, searchText);
}

bool initialized() {
    return api.library && api.ugc && api.utils;
}

void unload(bool callShutdown) {
    if (!api.library) return;
    void *library = api.library;
    ShutdownFn shutdown = api.shutdown;
    if (callShutdown && shutdown) shutdown();
    api = Api{};
    dlclose(library);
}
}

extern "C" int lwe_steam_init(uint32_t app_id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (initialized()) return 1;

    lastError.clear();
    api.appId = app_id ? app_id : kWallpaperEngineAppId;
    const std::string id = std::to_string(api.appId);
    setenv("SteamAppId", id.c_str(), 1);
    setenv("SteamGameId", id.c_str(), 1);

    for (const auto &candidate : libraryCandidates()) {
        api.library = dlopen(candidate.c_str(), RTLD_NOW | RTLD_LOCAL);
        if (api.library) break;
    }
    if (!api.library) {
        setError("libsteam_api.so was not found. Set LWE_STEAM_API_LIBRARY to the Steamworks redistributable path.");
        return 0;
    }
    if (!loadCoreSymbols()) {
        unload(false);
        return 0;
    }
    if (!api.isSteamRunning()) {
        setError("Steam client is not running");
        unload(false);
        return 0;
    }
    if (!api.init()) {
        setError("SteamAPI_Init failed for app 431960");
        unload(false);
        return 0;
    }
    if (!loadRuntimeSymbols()) {
        unload(true);
        return 0;
    }
    return 1;
}

extern "C" void lwe_steam_shutdown(void) {
    std::lock_guard<std::mutex> lock(apiMutex);
    unload(true);
}

extern "C" int lwe_steam_available(void) {
    std::lock_guard<std::mutex> lock(apiMutex);
    return initialized() && api.isSteamRunning && api.isSteamRunning();
}

extern "C" const char *lwe_steam_last_error(void) {
    return lastError.c_str();
}

extern "C" char *lwe_steam_query_json(int query_type, int item_type, uint32_t page,
                                        const char *search_text, const char *required_tags,
                                        const char *excluded_tags, int match_any_tag,
                                        int long_description) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (!initialized()) return nullptr;
    uint64_t handle = api.createQueryAll(api.ugc, query_type, item_type, api.appId, api.appId, std::max(page, 1u));
    if (handle == kInvalidQueryHandle) {
        setError("Steamworks failed to create UGC query");
        return nullptr;
    }
    applyQueryOptions(handle, search_text, required_tags, excluded_tags, match_any_tag, long_description);
    const uint64_t call = api.sendQuery(api.ugc, handle);
    SteamUGCQueryCompleted completed{};
    if (!waitForCall(call, completed)) {
        api.releaseQuery(api.ugc, handle);
        return nullptr;
    }
    const std::string result = collectQuery(handle, completed);
    api.releaseQuery(api.ugc, handle);
    return copyResult(result);
}

extern "C" char *lwe_steam_details_json(const uint64_t *ids, uint32_t count, int long_description) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (!initialized() || !ids || count == 0) return copyResult("[]");
    std::vector<uint64_t> mutableIds(ids, ids + count);
    uint64_t handle = api.createDetailsQuery(api.ugc, mutableIds.data(), count);
    if (handle == kInvalidQueryHandle) {
        setError("Steamworks failed to create item details query");
        return nullptr;
    }
    applyQueryOptions(handle, nullptr, nullptr, nullptr, 0, long_description);
    const uint64_t call = api.sendQuery(api.ugc, handle);
    SteamUGCQueryCompleted completed{};
    if (!waitForCall(call, completed)) {
        api.releaseQuery(api.ugc, handle);
        return nullptr;
    }
    std::ostringstream out;
    out << '[';
    bool first = true;
    for (uint32_t i = 0; i < completed.numResultsReturned; ++i) {
        SteamUGCDetails details{};
        if (!api.getQueryResult(api.ugc, handle, i, &details) || details.result != 1) continue;
        if (!first) out << ',';
        first = false;
        out << itemJson(handle, i, details);
    }
    out << ']';
    api.releaseQuery(api.ugc, handle);
    return copyResult(out.str());
}

extern "C" int lwe_steam_subscribe(uint64_t id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    return initialized() && api.subscribe(api.ugc, id) != 0;
}

extern "C" int lwe_steam_unsubscribe(uint64_t id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    return initialized() && api.unsubscribe(api.ugc, id) != 0;
}

extern "C" uint32_t lwe_steam_item_state(uint64_t id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    return initialized() ? api.getItemState(api.ugc, id) : 0;
}

extern "C" char *lwe_steam_subscribed_json(void) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (!initialized()) return copyResult("[]");
    const uint32_t count = api.getNumSubscribed(api.ugc, false);
    std::vector<uint64_t> ids(count);
    const uint32_t actual = count ? api.getSubscribed(api.ugc, ids.data(), count, false) : 0;
    std::ostringstream out;
    out << '[';
    for (uint32_t i = 0; i < actual; ++i) {
        if (i) out << ',';
        out << '"' << ids[i] << '"';
    }
    out << ']';
    return copyResult(out.str());
}

extern "C" char *lwe_steam_download_info_json(uint64_t id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (!initialized()) return nullptr;
    uint64_t current = 0;
    uint64_t total = 0;
    if (!api.getDownloadInfo(api.ugc, id, &current, &total)) return nullptr;
    std::ostringstream out;
    out << "{\"current\":\"" << current << "\",\"total\":\"" << total << "\"}";
    return copyResult(out.str());
}

extern "C" char *lwe_steam_install_info_json(uint64_t id) {
    std::lock_guard<std::mutex> lock(apiMutex);
    if (!initialized()) return nullptr;
    uint64_t size = 0;
    uint32_t timestamp = 0;
    char folder[4096]{};
    if (!api.getInstallInfo(api.ugc, id, &size, folder, sizeof(folder), &timestamp)) return nullptr;
    std::ostringstream out;
    out << "{\"sizeOnDisk\":\"" << size << "\",\"folder\":\"" << jsonEscape(folder)
        << "\",\"timestamp\":" << timestamp << '}';
    return copyResult(out.str());
}

extern "C" void lwe_steam_free(char *value) {
    std::free(value);
}
