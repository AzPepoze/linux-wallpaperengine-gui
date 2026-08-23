#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

int lwe_steam_init(uint32_t app_id);
void lwe_steam_shutdown(void);
int lwe_steam_available(void);
const char *lwe_steam_last_error(void);

char *lwe_steam_query_json(
    int query_type,
    int item_type,
    uint32_t page,
    const char *search_text,
    const char *required_tags,
    const char *excluded_tags,
    int match_any_tag,
    int long_description);

char *lwe_steam_details_json(const uint64_t *ids, uint32_t count, int long_description);

int lwe_steam_subscribe(uint64_t id);
int lwe_steam_unsubscribe(uint64_t id);
uint32_t lwe_steam_item_state(uint64_t id);
char *lwe_steam_subscribed_json(void);
char *lwe_steam_download_info_json(uint64_t id);
char *lwe_steam_install_info_json(uint64_t id);

void lwe_steam_free(char *value);

#ifdef __cplusplus
}
#endif
