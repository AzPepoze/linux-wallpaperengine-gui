<script lang="ts">
     import GridIcon from "../icons/GridIcon.svelte";
     import ListIcon from "../icons/ListIcon.svelte";
     import DisplayIcon from "../icons/DisplayIcon.svelte";
     import ApplyAllIcon from "../icons/ApplyAllIcon.svelte";
     import Button from "./ui/Button.svelte";
     import WallpaperItemGrid from "./WallpaperItemGrid.svelte";
     import WallpaperItemList from "./WallpaperItemList.svelte";
     import { showDisplayManager } from "../scripts/ui";
     import { cloneMode, toggleCloneMode } from "../scripts/display";
     import { fly } from "svelte/transition";
     import { WallpaperData, Wallpaper } from "../../shared/types";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let activeWallpaper: Wallpaper | null = null;
     export let selectedWallpaper: Wallpaper | null = null;
     export let selectedScreen: string | null = null;
     export let loading: boolean = true;
     export let error: string | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void = () => {};

     let viewMode: "grid" | "detail" = "grid";

     function selectWallpaper(folderName: string, wallpaper: WallpaperData) {
          onSelect(folderName, wallpaper);
     }

     async function handleToggleCloneMode() {
          const newMode = !$cloneMode;
          await toggleCloneMode(
               newMode,
               selectedWallpaper?.folderName || activeWallpaper?.folderName,
          );
     }
</script>

<div class="container">
     <div class="toolbar">
          <div class="left-actions"></div>

          <div class="status-info">
               <div class="status-item">
                    <span class="label">CURRENTLY USING :</span>
                    {#if activeWallpaper}
                         <span
                              in:fly={{ y: 20, duration: 300 }}
                              out:fly={{ y: -20, duration: 300 }}
                              class="value"
                              >{activeWallpaper.projectData?.title ||
                                   activeWallpaper.folderName}</span
                         >
                    {/if}
               </div>
               <div class="status-item">
                    <span class="label">DISPLAY :</span>
                    {#if selectedScreen || $cloneMode}
                         <span
                              in:fly={{ y: 20, duration: 300 }}
                              out:fly={{ y: -20, duration: 300 }}
                              class="value"
                              >{$cloneMode ? "ALL" : selectedScreen}</span
                         >
                    {/if}

                    <Button
                         variant={$showDisplayManager ? "primary" : "secondary"}
                         on:click={() => showDisplayManager.update((v) => !v)}
                         title="Toggle Display Manager"
                         style="padding: 8px; margin-right: 5px; border-radius: 10px;"
                    >
                         <DisplayIcon width="20" height="20" />
                         <span>Display</span>
                    </Button>

                    <Button
                         variant={$cloneMode ? "primary" : "secondary"}
                         on:click={handleToggleCloneMode}
                         title="Clone mode (Apply to all displays)"
                         style="padding: 8px; margin-right: 10px; border-radius: 10px;"
                    >
                         <ApplyAllIcon width="20" height="20" />
                         <span>Clone mode</span>
                    </Button>
               </div>
          </div>

          <div class="mode-toggles">
               <Button
                    variant={viewMode === "grid" ? "primary" : "secondary"}
                    on:click={() => (viewMode = "grid")}
                    title="Grid View"
               >
                    <GridIcon />
                    <span>Grid</span>
               </Button>
               <Button
                    variant={viewMode === "detail" ? "primary" : "secondary"}
                    on:click={() => (viewMode = "detail")}
                    title="Detail View"
               >
                    <ListIcon />
                    <span>List</span>
               </Button>
          </div>
     </div>

     <div class="wallpaper-container">
          {#if loading}
               <div class="status-msg">Loading...</div>
          {:else if error}
               <div class="status-msg error">{error}</div>
          {:else if Object.keys(wallpapers).length === 0}
               <div class="status-msg">No wallpapers found.</div>
          {:else if viewMode === "grid"}
               <WallpaperItemGrid
                    {wallpapers}
                    {selectedWallpaper}
                    onSelect={selectWallpaper}
               />
          {:else}
               <WallpaperItemList
                    {wallpapers}
                    {selectedWallpaper}
                    onSelect={selectWallpaper}
               />
          {/if}
     </div>
</div>

<style lang="scss">
     .container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          height: 100%;
          min-height: 0;
     }

     .toolbar {
          padding: 10px 15px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          background: var(--top-bar-bg);
          border-radius: 20px;
          gap: 15px;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;

          .left-actions {
               display: flex;
               flex: 1;
               justify-content: flex-start;
          }

          .status-info {
               display: flex;
               flex-wrap: wrap;
               justify-content: center;
               align-items: center;
               gap: 15px 32px;
               font-size: 0.95em;
               flex: 0 1 auto;

               .status-item {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;

                    .label {
                         color: var(--text-muted);
                         font-weight: 600;
                         letter-spacing: 0.5px;
                         font-size: 0.85em;
                    }

                    .value {
                         color: var(--btn-primary-bg);
                         font-weight: 700;
                         text-transform: uppercase;
                    }
               }
          }

          .mode-toggles {
               display: flex;
               flex: 1;
               justify-content: flex-end;
               gap: 6px;
          }
     }

     .wallpaper-container {
          flex-grow: 1;
          text-align: center;
          overflow-y: auto;
          width: 100%;
          position: relative;
          mask-image: linear-gradient(
               to bottom,
               transparent,
               black 20px,
               black 97%,
               transparent
          );

          .status-msg {
               padding: 40px;
               color: var(--text-muted);
               font-size: 1.1em;

               &.error {
                    color: var(--error-color);
               }
          }
     }
</style>
