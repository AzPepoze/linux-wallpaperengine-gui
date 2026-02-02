<script lang="ts">
     import { onMount, tick } from "svelte";
     import { activeView } from "../scripts/ui";
     import { settingsStore, showToast } from "../scripts/settings";
     import Input from "./ui/Input.svelte";
     import Button from "./ui/Button.svelte";
     import BrowseTab from "./browse/BrowseTab.svelte";
     import {
          formatWorkshopItem,
          isValidWorkshopItem,
          type PublishedFileDetails,
          type WorkshopItem,
     } from "../utils/workshopHelper";

     interface FilterCategory {
          name: string;
          items: string[];
     }

     let searching = false;
     let selectedFileIds = "";
     let steamApiKey = "";
     let hasApiKey = false;

     const filterCategories: FilterCategory[] = [
          {
               name: "Type",
               items: ["Scene", "Video", "Application", "Web"],
          },
          {
               name: "Genre",
               items: [
                    "Abstract",
                    "Animal",
                    "Anime",
                    "Cartoon",
                    "CGI",
                    "Cyberpunk",
                    "Fantasy",
                    "Game",
                    "Girls",
                    "Guys",
                    "Landscape",
                    "Medieval",
                    "Memes",
                    "MMD",
                    "Music",
                    "Nature",
                    "Pixel art",
                    "Relaxing",
                    "Retro",
                    "Sci-Fi",
                    "Sports",
                    "Technology",
                    "Television",
                    "Vehicle",
                    "Unspecified",
               ],
          },
          {
               name: "Age Rating",
               items: ["Everyone", "Questionable", "Mature"],
          },
          {
               name: "Resolution",
               items: [
                    "Standard Definition",
                    "1280 x 720",
                    "1366 x 768",
                    "1920 x 1080",
                    "2560 x 1440",
                    "3840 x 2160",
                    "Ultrawide Standard Definition",
                    "Ultrawide 2560 x 1080",
                    "Ultrawide 3440 x 1440",
                    "Dual Standard Definition",
                    "Dual 3840 x 1080",
                    "Dual 5120 x 1440",
                    "Dual 7680 x 2160",
                    "Triple Standard Definition",
                    "Triple 4096 x 768",
                    "Triple 5760 x 1080",
                    "Triple 7680 x 1440",
                    "Triple 11520 x 2160",
                    "Portrait Standard Definition",
                    "Portrait 720 x 1280",
                    "Portrait 1080 x 1920",
                    "Portrait 1440 x 2560",
                    "Portrait 2160 x 3840",
                    "Other resolution",
                    "Dynamic resolution",
               ],
          },
          {
               name: "Category",
               items: ["Wallpaper", "Preset", "Asset"],
          },
          {
               name: "Miscellaneous",
               items: [
                    "Approved",
                    "Audio responsive",
                    "3D",
                    "Customizable",
                    "Puppet Warp",
                    "HDR",
                    "Media Integration",
                    "User Shortcut",
                    "Video Texture",
                    "Asset Pack",
               ],
          },
     ];

     let selectedFilters = new Map<string, Set<string>>();
     let browseItems: WorkshopItem[] = [];
     let browseLoading = false;
     let browseCursor: string | null = null;
     let totalItems = 0; // Total items available
     let pageCursors: Map<number, string> = new Map([[0, "*"]]); // page -> cursor mapping

     onMount(async () => {
          if ($settingsStore?.steamApiKey) {
               steamApiKey = $settingsStore.steamApiKey;
               hasApiKey = true;
          }
     });

     async function handleSearchByIds() {
          if (!selectedFileIds.trim()) {
               showToast("Please enter file IDs", "info");
               return;
          }

          searching = true;
          try {
               const fileIds = selectedFileIds
                    .split(",")
                    .map((id) => id.trim())
                    .filter((id) => id.length > 0);

               const result: PublishedFileDetails[] =
                    await window.electronAPI.getPublishedFileDetails(fileIds);

               const validItems = result
                    .filter(isValidWorkshopItem)
                    .map((details: PublishedFileDetails) =>
                         formatWorkshopItem(details),
                    );

               browseItems = validItems;
               totalItems = validItems.length;
          } catch (error) {
               console.error("Error searching:", error);
               const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";
               showToast(`Error searching: ${errorMsg}`, "error");
          } finally {
               searching = false;
          }
     }

     async function handleSearchByCollection() {
          if (!selectedFileIds.trim()) {
               showToast("Please enter a collection ID", "info");
               return;
          }

          searching = true;
          try {
               const collectionId = selectedFileIds.trim();
               const result: PublishedFileDetails[] =
                    await window.electronAPI.getCollectionDetails([
                         collectionId,
                    ]);

               const validItems = result
                    .filter(isValidWorkshopItem)
                    .map((details: PublishedFileDetails) =>
                         formatWorkshopItem(details),
                    );

               browseItems = validItems;
               totalItems = validItems.length;
          } catch (error) {
               console.error("Error loading collection:", error);
               const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";
               showToast(`Error loading collection: ${errorMsg}`, "error");
          } finally {
               searching = false;
          }
     }

     function toggleFilter(category: string, filter: string) {
          console.log(
               "Workshop.toggleFilter called with:",
               category,
               filter,
               "Was selected:",
               selectedFilters.get(category)?.has(filter),
          );

          // Create a new Map to ensure reactivity
          const newSelectedFilters = new Map(selectedFilters);

          if (!newSelectedFilters.has(category)) {
               newSelectedFilters.set(category, new Set());
          }

          const filters = newSelectedFilters.get(category)!;
          if (filters.has(filter)) {
               filters.delete(filter);
          } else {
               filters.add(filter);
          }

          // Force reactivity by assigning
          selectedFilters = newSelectedFilters;

          console.log(
               "Workshop.toggleFilter result - selectedFilters now:",
               selectedFilters,
          );
     }

     async function loadBrowseItems(pageNum: number = 0) {
          browseLoading = true;
          try {
               // Collect all selected filters
               const allFilters: string[] = [];
               selectedFilters.forEach((filters) => {
                    allFilters.push(...Array.from(filters));
               });

               // Get cursor for this page (default to '*' for first page)
               const cursor =
                    pageCursors.get(pageNum) || (pageNum === 0 ? "*" : null);
               if (!cursor) {
                    showToast("No more pages available", "info");
                    return;
               }

               console.log(
                    "loadBrowseItems called: page=" +
                         pageNum +
                         " filters=" +
                         allFilters.length +
                         " selectedFilters=" +
                         Array.from(allFilters).join(","),
               );
               const result = await window.electronAPI.queryWorkshopFiles(
                    steamApiKey,
                    {
                         requiredtags:
                              allFilters.length > 0 ? allFilters : undefined,
                         cursor: cursor,
                         numperpage: 50,
                    },
               );

               console.log(
                    "API Response: total=" +
                         result?.total +
                         " items=" +
                         (result?.items?.length || 0) +
                         " nextCursor=" +
                         !!result?.nextCursor,
               );

               const validItems = (result?.items || [])
                    .filter(isValidWorkshopItem)
                    .map((details: PublishedFileDetails) =>
                         formatWorkshopItem(details),
                    );

               // Always replace items (don't accumulate across pages)
               browseItems = validItems;
               totalItems = result?.total || 0;
               const firstItem =
                    validItems.length > 0 ? validItems[0].title : "none";
               console.log(
                    "Loaded page " + pageNum + " | First item: " + firstItem,
               );

               // Store the next cursor if available
               if (result?.nextCursor) {
                    pageCursors.set(pageNum + 1, result.nextCursor);
                    browseCursor = result.nextCursor; // Enable Next button
               } else {
                    browseCursor = null; // No more pages
               }

               console.log(
                    "Loaded " +
                         validItems.length +
                         " items | Next button: " +
                         !!browseCursor,
               );

               if (browseItems.length === 0) {
                    showToast("No items found", "info");
               }
          } catch (error) {
               console.error("Error browsing workshop:", error);
               const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";
               showToast(`Error browsing workshop: ${errorMsg}`, "error");
          } finally {
               browseLoading = false;
          }
     }

     function openBrowseWithFilters() {
          const allFilters: string[] = [];
          selectedFilters.forEach((filters) => {
               allFilters.push(...Array.from(filters));
          });
          let url: string;

          if (allFilters.length > 0) {
               url = `https://steamcommunity.com/workshop/browse/?appid=431960&searchtext=&requiredtags[]=${allFilters[0]}`;
          } else {
               url = `https://steamcommunity.com/workshop/browse/?appid=431960`;
          }

          window.electronAPI.openExternal(url);
     }

     async function setupSteamApiKey() {
          activeView.set("settings");
          await tick();
          const settingsSection = document.querySelector(
               '[data-section="steam-api-key"]',
          );
          if (settingsSection) {
               settingsSection.scrollIntoView({ behavior: "smooth" });
          }
     }
</script>

<div class="workshop-container">
     {#if !hasApiKey}
          <div class="no-api-key">
               <div class="no-api-key-content">
                    <h2>Steam API Key Required</h2>
                    <p>
                         To access the Steam Workshop features, you need to
                         configure your Steam API key in the settings.
                    </p>
                    <Button on:click={setupSteamApiKey}
                         >Get Steam API Key</Button
                    >
               </div>
          </div>
     {:else}
          <div class="workshop-controls">
               <div class="search-section">
                    <Input
                         type="text"
                         placeholder="Search by file ID or collection ID..."
                         bind:value={selectedFileIds}
                    />
                    <Button on:click={handleSearchByIds} disabled={searching}>
                         {#if searching}
                              Searching...
                         {:else}
                              Search IDs
                         {/if}
                    </Button>
                    <div class="divider">or</div>
                    <Button
                         variant="secondary"
                         on:click={handleSearchByCollection}
                         disabled={searching}
                    >
                         {#if searching}
                              Loading...
                         {:else}
                              Load Collection
                         {/if}
                    </Button>
               </div>
          </div>

          <BrowseTab
               {filterCategories}
               {selectedFilters}
               {browseItems}
               {browseLoading}
               {browseCursor}
               {totalItems}
               onToggleFilter={toggleFilter}
               onLoadBrowseItems={loadBrowseItems}
               onOpenBrowseWithFilters={openBrowseWithFilters}
          />
     {/if}
</div>

<style lang="scss">
     .workshop-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
     }

     .no-api-key {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;

          .no-api-key-content {
               max-width: 500px;

               h2 {
                    margin: 0 0 16px;
                    font-size: 1.5em;
                    color: var(--text-color);
               }

               p {
                    margin: 0 0 24px;
                    color: var(--text-muted);
                    line-height: 1.6;
               }

               :global(button) {
                    margin: 0 auto;
                    display: block;
               }
          }
     }

     .workshop-controls {
          padding: 20px 40px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-surface);

          .search-section {
               display: flex;
               gap: 12px;
               align-items: flex-end;
               max-width: 600px;

               :global(input) {
                    flex: 1;
               }

               :global(button) {
                    white-space: nowrap;
               }

               .divider {
                    color: var(--text-muted);
                    font-size: 0.9em;
               }
          }
     }
</style>
