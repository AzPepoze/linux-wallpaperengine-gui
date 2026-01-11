<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../shared/types";
     import { fade } from "svelte/transition";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let selectedWallpaper: Wallpaper | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void;
</script>

<div class="wallpaper-list" in:fade={{ duration: 200 }}>
     {#each Object.entries(wallpapers) as [folderName, wallpaper]}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
               class="list-item"
               class:selected={selectedWallpaper?.folderName === folderName}
               on:click={() => onSelect(folderName, wallpaper)}
               role="button"
               tabindex="0"
          >
               <div class="item-preview">
                    {#if wallpaper.previewData}
                         <img
                              src={wallpaper.previewData}
                              alt={wallpaper.projectData?.title || folderName}
                         />
                    {:else}
                         <div class="placeholder"></div>
                    {/if}
               </div>
               <div class="item-info">
                    <div class="item-title">
                         {wallpaper.projectData?.title || folderName}
                    </div>
                    {#if wallpaper.projectData?.type}
                         <div class="item-desc">
                              <p class="item-type">
                                   Type : {wallpaper.projectData.type}
                              </p>
                              <p class="item-tags">
                                   Tags : {wallpaper.projectData.tags?.join(
                                        ", ",
                                   )}
                              </p>
                              <p class="item-folder">
                                   Folder : {folderName}
                              </p>
                         </div>
                    {/if}
               </div>
          </div>
     {/each}
</div>

<style lang="scss">
     .wallpaper-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px;
          box-sizing: border-box;
          width: 100%;

          .list-item {
               display: flex;
               align-items: center;
               gap: 16px;
               padding: 10px;
               background: rgba(255, 255, 255, 0.05);
               border-radius: 8px;
               cursor: pointer;
               transition: all 0.2s ease;
               border: 2px solid transparent;
               text-align: left;
               box-sizing: border-box;

               &:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateX(4px);
               }

               &.selected {
                    border-color: var(--btn-primary-bg, #007bff);
                    background: rgba(0, 123, 255, 0.1);
               }

               .item-preview {
                    --size: 100px;

                    width: var(--size);
                    height: var(--size);
                    flex-shrink: 0;
                    border-radius: 4px;
                    overflow: hidden;
                    background: var(--preview-placeholder-bg);
                    box-shadow: var(--normal-shadow);

                    img {
                         width: 100%;
                         height: 100%;
                         object-fit: cover;
                    }

                    .placeholder {
                         width: 100%;
                         height: 100%;
                    }
               }

               .item-info {
                    flex-grow: 1;
                    min-width: 0;

                    .item-title {
                         font-weight: 600;
                         margin-bottom: 4px;
                         white-space: nowrap;
                         overflow: hidden;
                         text-overflow: ellipsis;
                    }

                    .item-desc {
                         font-size: 0.85em;
                         color: #aaa;
                         white-space: nowrap;
                         overflow: hidden;
                         text-overflow: ellipsis;

                         p {
                              margin: 0;
                         }

                         .item-type {
                              color: rgb(125, 255, 255);
                         }
                         .item-tags {
                              color: rgb(255, 200, 100);
                         }
                         .item-folder {
                              color: rgb(150, 255, 150);
                         }
                    }
               }
          }
     }
</style>
