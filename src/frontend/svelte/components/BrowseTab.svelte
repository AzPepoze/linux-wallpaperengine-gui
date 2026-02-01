<script lang="ts">
     import { onMount } from "svelte";
     import Button from "./ui/Button.svelte";
     import ActionToggle from "./ActionToggle.svelte";
     import GridIcon from "../icons/GridIcon.svelte";
     import ListIcon from "../icons/ListIcon.svelte";
     import WallpaperItemGrid from "./WallpaperItemGrid.svelte";
     import WallpaperItemList from "./WallpaperItemList.svelte";
     import Sidebar from "./Sidebar.svelte";
     import { fade, scale } from "svelte/transition";
     import type { WorkshopItem } from "../utils/workshopHelper";
     import type { WallpaperData, Wallpaper } from "../../shared/types";

     export let genres: string[] = [];
     export let tags: string[] = [];
     export let selectedGenres: Set<string>;
     export let selectedTags: Set<string>;
     export let browseItems: WorkshopItem[] = [];
     export let browseLoading: boolean = false;
     export let totalItems: number = 0;

     export let onToggleGenre: (genre: string) => void;
     export let onToggleTag: (tag: string) => void;
     export let onLoadBrowseItems: (page: number) => void;
     export let onOpenBrowseWithFilters: () => void;
     export let browseCursor: string | null = null;

     let activeAction: "load" | "browse" = "load";
     let viewMode: "grid" | "list" = "grid";
     let contentElement: HTMLElement;
     let selectedWorkshopItem: WorkshopItem | null = null;
     let selectedWorkshopData: WallpaperData | null = null;
     let selectedItemId: string | null = null;
     let currentPageNum: number = 0;

     // Debug: log button state changes
     $: {
          console.log(
               "Button state - browseLoading:",
               browseLoading,
               "browseCursor:",
               browseCursor,
               "nextDisabled:",
               !browseCursor,
          );
     }

     function convertWorkshopItemToWallpaperData(
          item: WorkshopItem,
     ): WallpaperData {
          return {
               projectData: {
                    title: item.title,
                    description: item.description,
                    file: item.publishedFileId,
                    preview: item.previewUrl || "",
                    type: "workshop",
                    tags: item.tags,
                    workshopid: item.publishedFileId,
                    views: item.views,
                    subscriptions: item.subscriptions,
                    isWorkshop: true,
               },
               previewPath: item.previewUrl,
          };
     }

     function convertToWallpaperRecord(): Record<string, WallpaperData> {
          const record: Record<string, WallpaperData> = {};
          browseItems.forEach((item) => {
               record[item.publishedFileId] =
                    convertWorkshopItemToWallpaperData(item);
          });
          return record;
     }

     function handleItemSelect(
          folderName: string,
          wallpaperData: WallpaperData,
     ) {
          const item = browseItems.find(
               (i) => i.publishedFileId === folderName,
          );
          if (item) {
               selectedWorkshopItem = item;
               selectedWorkshopData = wallpaperData;
               selectedItemId = folderName;
          }
     }

     function closeSidebar() {
          selectedWorkshopItem = null;
          selectedWorkshopData = null;
          selectedItemId = null;
     }

     function handleToggleTag(tag: string) {
          console.log("BrowseTab: handleToggleTag called with:", tag);
          onToggleTag(tag);
          // Reset to first page when filter changes
          currentPageNum = 0;
          // Wait for state update before loading
          setTimeout(() => {
               console.log(
                    "BrowseTab: After state update, calling onLoadBrowseItems",
               );
               onLoadBrowseItems(0);
          }, 0);
     }

     function handleToggleGenre(genre: string) {
          console.log("BrowseTab: handleToggleGenre called with:", genre);
          onToggleGenre(genre);
          // Reset to first page when filter changes
          currentPageNum = 0;
          // Wait for state update before loading
          setTimeout(() => {
               console.log(
                    "BrowseTab: After state update, calling onLoadBrowseItems",
               );
               onLoadBrowseItems(0);
          }, 0);
     }

     $: selectedWallpaper =
          selectedItemId && selectedWorkshopData
               ? ({
                      ...selectedWorkshopData,
                      folderName: selectedItemId,
                 } as Wallpaper)
               : null;

     // Update page when browseCursor changes (has-more marker)
     $: if (browseCursor === "has-more") {
          console.log("Has more pages available");
     }

     // Close sidebar when items finish loading and scroll to top
     $: if (!browseLoading && browseItems.length > 0) {
          closeSidebar();
          if (contentElement) {
               contentElement.scrollTop = 0;
          }
     }

     onMount(() => {
          // Load page 0
          currentPageNum = 0;
          onLoadBrowseItems(0);
     });
</script>

<div class="browse-tab">
     <div class="browse-layout">
          <div class="filter-sidebar">
               <div class="filter-group">
                    <h4>Genres</h4>
                    <div class="filter-list">
                         {#each genres as genre}
                              <button
                                   class="filter-item"
                                   class:active={selectedGenres.has(genre)}
                                   on:click={() => handleToggleGenre(genre)}
                              >
                                   <span class="item-button"></span>
                                   <span>{genre}</span>
                              </button>
                         {/each}
                    </div>
               </div>

               <div class="filter-group">
                    <h4>Tags</h4>
                    <div class="filter-list">
                         {#each tags as tag}
                              <button
                                   class="filter-item"
                                   class:active={selectedTags.has(tag)}
                                   on:click={() => handleToggleTag(tag)}
                              >
                                   <span class="item-button"></span>
                                   <span>{tag}</span>
                              </button>
                         {/each}
                    </div>
               </div>

               <ActionToggle
                    bind:activeAction
                    onLoadItems={() => {
                         currentPageNum = 0;
                         setTimeout(() => onLoadBrowseItems(0), 0);
                    }}
                    onOpenInBrowser={onOpenBrowseWithFilters}
                    isLoading={browseLoading}
               />
          </div>

          <div class="browse-content" bind:this={contentElement}>
               {#if browseLoading && browseItems.length === 0}
                    <div class="loading" in:fade={{ duration: 200 }}>
                         <div class="spinner"></div>
                         <p>Page {currentPageNum + 1}</p>
                    </div>
               {:else if browseItems.length === 0}
                    <div class="browse-instruction" in:fade={{ duration: 200 }}>
                         <h3>Browse Steam Workshop</h3>
                         <p>
                              Select filters on the left and click "Load Items"
                              to browse the Steam Workshop with your selected
                              filters applied.
                         </p>
                         <p>
                              Or click "Open in Browser" to browse directly on
                              Steam Workshop.
                         </p>
                    </div>
               {:else if browseLoading}
                    <div class="loading" in:fade={{ duration: 200 }}>
                         <div class="spinner"></div>
                         <p>Page {currentPageNum + 1}</p>
                    </div>
               {:else}
                    <div class="browse-header">
                         <div class="view-toggles">
                              <Button
                                   variant={viewMode === "grid"
                                        ? "primary"
                                        : "secondary"}
                                   on:click={() => (viewMode = "grid")}
                                   title="Grid View"
                              >
                                   <GridIcon width="20" height="20" />
                                   <span>Grid</span>
                              </Button>
                              <Button
                                   variant={viewMode === "list"
                                        ? "primary"
                                        : "secondary"}
                                   on:click={() => (viewMode = "list")}
                                   title="List View"
                              >
                                   <ListIcon width="20" height="20" />
                                   <span>List</span>
                              </Button>
                         </div>
                    </div>

                    {#if viewMode === "grid"}
                         {#key viewMode}
                              <div in:scale={{ duration: 300, start: 0.95 }}>
                                   <WallpaperItemGrid
                                        wallpapers={convertToWallpaperRecord()}
                                        {selectedWallpaper}
                                        onSelect={handleItemSelect}
                                   />
                              </div>
                         {/key}
                    {:else}
                         {#key viewMode}
                              <div in:scale={{ duration: 300, start: 0.95 }}>
                                   <WallpaperItemList
                                        wallpapers={convertToWallpaperRecord()}
                                        {selectedWallpaper}
                                        onSelect={handleItemSelect}
                                   />
                              </div>
                         {/key}
                    {/if}

                    <div class="pagination-controls">
                         <Button
                              variant="secondary"
                              on:click={() => {
                                   if (currentPageNum > 0) {
                                        currentPageNum--;
                                        onLoadBrowseItems(currentPageNum);
                                   }
                              }}
                              disabled={currentPageNum === 0 || browseLoading}
                         >
                              ← Prev
                         </Button>
                         <input
                              type="number"
                              class="page-input"
                              value={currentPageNum + 1}
                              min="1"
                              on:change={(e) => {
                                   const target = e.target as HTMLInputElement;
                                   const pageNum = Math.max(
                                        0,
                                        parseInt(target.value) - 1,
                                   );
                                   currentPageNum = pageNum;
                                   onLoadBrowseItems(pageNum);
                              }}
                              disabled={browseLoading}
                         />
                         <span class="page-label"
                              >/ {Math.ceil((totalItems || 1) / 50)}</span
                         >
                         <Button
                              variant="secondary"
                              on:click={() => {
                                   if (browseCursor) {
                                        currentPageNum++;
                                        onLoadBrowseItems(currentPageNum);
                                   }
                              }}
                              disabled={browseLoading || !browseCursor}
                         >
                              Next →
                         </Button>
                    </div>
               {/if}
          </div>

          {#if selectedWorkshopItem && selectedWorkshopData}
               <Sidebar {selectedWallpaper} onClose={closeSidebar} />
          {/if}
     </div>
</div>

<style lang="scss">
     .browse-tab {
          padding: 0;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
          flex: 1;
          display: flex;
          overflow: hidden;

          .browse-layout {
               display: flex;
               width: 100%;
               height: 100%;

               .filter-sidebar {
                    width: 250px;
                    padding: 20px;
                    border-right: 1px solid var(--border-color);
                    overflow-y: auto;
                    background: var(--bg-color);

                    .filter-group {
                         margin-bottom: 24px;

                         h4 {
                              margin: 0 0 12px;
                              font-size: 0.95em;
                              font-weight: 600;
                              color: var(--text-color);
                         }

                         .filter-list {
                              display: flex;
                              flex-direction: column;
                              gap: 8px;

                              .filter-item {
                                   display: flex;
                                   align-items: center;
                                   gap: 10px;
                                   padding: 8px 12px;
                                   color: var(--text-muted);
                                   font-size: 0.9em;
                                   transition: var(--transition-base);
                                   text-align: left;
                                   background: transparent;
                                   border: 1px solid transparent;
                                   border-radius: var(--radius-md);
                                   cursor: pointer;
                                   width: 100%;

                                   .item-button {
                                        display: inline-block;
                                        width: 16px;
                                        height: 16px;
                                        background: transparent;
                                        border: 2px solid var(--border-color);
                                        border-radius: 0;
                                        flex-shrink: 0;
                                        transition: var(--transition-base);
                                   }

                                   span:last-child {
                                        flex: 1;
                                        text-align: left;
                                   }

                                   &:hover {
                                        color: var(--text-color);
                                        background: rgba(0, 123, 255, 0.05);
                                        border-color: var(--btn-primary-bg);
                                   }

                                   &.active {
                                        background: rgba(0, 123, 255, 0.1);
                                        border-color: var(--btn-primary-bg);
                                        color: var(--btn-primary-bg);

                                        .item-button {
                                             background: var(--btn-primary-bg);
                                             border-color: var(
                                                  --btn-primary-bg
                                             );
                                        }
                                   }
                              }
                         }
                    }
               }

               .browse-content {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;

                    .loading {
                         display: flex;
                         flex-direction: column;
                         align-items: center;
                         justify-content: center;
                         margin: auto;
                         color: var(--text-muted);
                         gap: 16px;

                         .spinner {
                              width: 40px;
                              height: 40px;
                              border: 4px solid var(--border-color);
                              border-top-color: var(--btn-primary-bg);
                              border-radius: 50%;
                              animation: spin 1s linear infinite;
                         }

                         p {
                              margin: 0;
                              font-size: 1em;
                         }
                    }

                    @keyframes spin {
                         to {
                              transform: rotate(360deg);
                         }
                    }

                    .browse-instruction {
                         max-width: 500px;
                         text-align: center;
                         margin: auto;

                         h3 {
                              margin: 0 0 16px;
                              font-size: 1.3em;
                              color: var(--text-color);
                         }

                         p {
                              margin: 0 0 12px;
                              color: var(--text-muted);
                              line-height: 1.6;
                         }
                    }

                    .browse-header {
                         width: 100%;
                         display: flex;
                         justify-content: flex-end;
                         margin-bottom: 20px;

                         .view-toggles {
                              display: flex;
                              gap: 8px;

                              :global(.btn) {
                                   padding: 8px 12px !important;
                                   font-size: 0.85em !important;
                              }
                         }
                    }

                    .pagination-controls {
                         position: sticky;
                         bottom: 10px;
                         left: 0;
                         right: 0;
                         display: flex;
                         justify-content: center;
                         align-items: center;
                         gap: 16px;
                         padding: 12px 20px;
                         background: var(--bg-app);
                         border-top: 1px solid var(--border-color);
                         box-sizing: border-box;
                         z-index: 10;
                         border-radius: 20px;
                         margin: 10px;

                         .page-input {
                              width: 60px;
                              padding: 8px 10px;
                              font-size: 1em;
                              font-weight: 600;
                              color: var(--text-color);
                              background: var(--bg-color);
                              border: 1px solid var(--border-color);
                              border-radius: var(--radius-md);
                              text-align: center;
                              cursor: pointer;
                              transition: all 0.2s ease;

                              &:hover:not(:disabled) {
                                   background: var(--bg-color);
                                   border-color: var(--btn-primary-bg);
                                   box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
                              }

                              &:focus {
                                   outline: none;
                                   background: var(--bg-color);
                                   border-color: var(--btn-primary-bg);
                                   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
                              }

                              &:disabled {
                                   opacity: 0.6;
                                   cursor: not-allowed;
                              }
                         }

                         .page-label {
                              font-size: 0.95em;
                              color: var(--text-muted);
                              min-width: 40px;
                         }

                         :global(.btn) {
                              padding: 8px 16px !important;
                              font-size: 0.9em !important;

                              &:disabled {
                                   opacity: 0.5;
                                   cursor: not-allowed;
                              }
                         }
                    }
               }
          }
     }
</style>
