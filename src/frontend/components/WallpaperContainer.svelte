<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../shared/types";
     import GridIcon from "../icons/GridIcon.svelte";
     import ListIcon from "../icons/ListIcon.svelte";
     import DisplayIcon from "../icons/DisplayIcon.svelte";
     import Button from "./ui/Button.svelte";
     import WallpaperItemGrid from "./WallpaperItemGrid.svelte";
     import WallpaperItemList from "./WallpaperItemList.svelte";
     import { showDisplayManager } from "../scripts/ui";

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
</script>

<div class="container">
     <div class="toolbar">
          <div class="left-actions"></div>

          <div class="status-info">
               {#if activeWallpaper}
                    <div class="status-item">
                         <span class="label">CURRENTLY USING :</span>
                         <span class="value"
                              >{activeWallpaper.projectData?.title ||
                                   activeWallpaper.folderName}</span
                         >
                    </div>
               {/if}
               {#if selectedScreen}
                    <div class="status-item">
                         <span class="label">DISPLAY :</span>
                         <span class="value">{selectedScreen}</span>

                         <Button
                              variant={$showDisplayManager
                                   ? "primary"
                                   : "secondary"}
                              on:click={() =>
                                   showDisplayManager.update((v) => !v)}
                              title="Toggle Display Manager"
                              style="padding: 8px; margin-right: 10px; border-radius: 10px;"
                         >
                              <DisplayIcon width="20" height="20" />
                         </Button>
                    </div>
               {/if}
          </div>

          <div class="mode-toggles">
               <Button
                    variant={viewMode === "grid" ? "primary" : "secondary"}
                    on:click={() => (viewMode = "grid")}
                    title="Grid View"
               >
                    <GridIcon />
               </Button>
               <Button
                    variant={viewMode === "detail" ? "primary" : "secondary"}
                    on:click={() => (viewMode = "detail")}
                    title="Detail View"
               >
                    <ListIcon />
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
          padding: 8px 15px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--top-bar-bg);
          min-height: 60px;
          border-radius: 20px;

          .left-actions {
               display: flex;
               flex: 1;
               justify-content: flex-start;
          }

          .status-info {
               display: flex;
               gap: 32px;
               font-size: 0.95em;

               white-space: nowrap;

               .status-item {
                    display: flex;
                    gap: 10px;
                    align-items: center;

                    .label {
                         color: #888;
                         font-weight: 600;
                         letter-spacing: 0.5px;
                         font-size: 0.85em;
                    }

                    .value {
                         color: var(--btn-primary-bg, #007bff);
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
          transition: width 0.3s ease-in-out;
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
               color: #aaa;
               font-size: 1.1em;

               &.error {
                    color: #ff6b6b;
               }
          }
     }
</style>
