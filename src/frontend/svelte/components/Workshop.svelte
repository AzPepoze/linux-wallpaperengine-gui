<script lang="ts">
     import { onMount } from "svelte";
     import { settingsStore, showToast } from "../scripts/settings";
     import Input from "./ui/Input.svelte";
     import Button from "./ui/Button.svelte";
     import BrowseTab from "./BrowseTab.svelte";
     import {
          formatWorkshopItem,
          isValidWorkshopItem,
          type PublishedFileDetails,
          type WorkshopItem,
     } from "../utils/workshopHelper";

     let searching = false;
     let selectedFileIds = "";
     let steamApiKey = "";
     let hasApiKey = false;

     const genres = [
          "Anime",
          "Game",
          "Landscape",
          "Music",
          "Nature",
          "Sci-Fi",
          "Technology",
          "Vehicle",
     ];

     const tags = [
          "60fps",
          "Action",
          "Chill",
          "Cyberpunk",
          "Dark",
          "Fantasy",
          "Glitch",
          "Indie",
          "Neon",
          "Nostalgia",
          "Pixel",
          "Relaxing",
          "Retro",
          "Synthwave",
          "Abstract",
     ];

     let selectedGenres = new Set<string>();
     let selectedTags = new Set<string>();
     let browseItems: WorkshopItem[] = [];
     let browseLoading = false;
     let browseCursor: string | null = null;
     let totalItems = 0; // Total items available
     let currentPageNum = 0; // For display
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

               showToast(`Found ${validItems.length} item(s)`, "success");
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

               showToast(`Loaded ${validItems.length} item(s)`, "success");
          } catch (error) {
               console.error("Error loading collection:", error);
               const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";
               showToast(`Error loading collection: ${errorMsg}`, "error");
          } finally {
               searching = false;
          }
     }

     function toggleGenre(genre: string) {
          console.log(
               "Workshop.toggleGenre called with:",
               genre,
               "Was selected:",
               selectedGenres.has(genre),
          );
          if (selectedGenres.has(genre)) {
               selectedGenres.delete(genre);
          } else {
               selectedGenres.add(genre);
          }
          selectedGenres = selectedGenres;
          console.log(
               "Workshop.toggleGenre result - selectedGenres now:",
               selectedGenres,
          );
     }

     function toggleTag(tag: string) {
          if (selectedTags.has(tag)) {
               selectedTags.delete(tag);
          } else {
               selectedTags.add(tag);
          }
          selectedTags = selectedTags;
          console.log("Tag toggled:", tag, "Current tags:", selectedTags);
     }

     async function loadBrowseItems(pageNum: number = 0) {
          browseLoading = true;
          try {
               const tagArray = Array.from(selectedTags);
               const genreArray = Array.from(selectedGenres);
               const allFilters = [...tagArray, ...genreArray];

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
                         " tags=" +
                         tagArray.length +
                         " genres=" +
                         genreArray.length +
                         " selectedGenres=" +
                         Array.from(selectedGenres).join(","),
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
               currentPageNum = pageNum;
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
               } else {
                    showToast(
                         `Loaded ${browseItems.length} item(s) (${result?.total || 0} total)`,
                         "success",
                    );
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
          const tagParams = Array.from(selectedTags);
          let url: string;

          if (tagParams.length > 0) {
               url = `https://steamcommunity.com/workshop/browse/?appid=431960&searchtext=&requiredtags[]=${tagParams[0]}`;
          } else {
               url = `https://steamcommunity.com/workshop/browse/?appid=431960`;
          }

          window.electronAPI.openExternal(url);
     }

     function setupSteamApiKey() {
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
               {genres}
               {tags}
               {selectedGenres}
               {selectedTags}
               {browseItems}
               {browseLoading}
               {browseCursor}
               {totalItems}
               onToggleGenre={toggleGenre}
               onToggleTag={toggleTag}
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
