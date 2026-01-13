<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../shared/types";
     import { fly } from "svelte/transition";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let selectedWallpaper: Wallpaper | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void;
</script>

<div
     class="wallpaper-list"
     in:fly={{ x: 20, delay: 200, duration: 200 }}
     out:fly={{ x: 20, duration: 200 }}
>
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
          gap: 10px;
          padding: 20px;
          box-sizing: border-box;
          width: 100%;

          .list-item {
               display: flex;
               align-items: center;
               gap: 16px;
               padding: 12px;
               background: var(--bg-surface);
               border-radius: var(--radius-lg);
               cursor: pointer;
               transition: var(--transition-base);
               border: 2px solid transparent;
               text-align: left;
               box-sizing: border-box;

               &:hover {
                    background: var(--bg-surface-hover);
                    transform: translateX(4px);
                    border-color: var(--border-color-hover);
               }

               &.selected {
                    border-color: var(--btn-primary-bg);
                    background: rgba(0, 123, 255, 0.1);
                    box-shadow: var(--shadow-sm);
               }

               .item-preview {
                    --size: 100px;

                    width: var(--size);
                    height: var(--size);
                    flex-shrink: 0;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    background: var(--preview-placeholder-bg);
                    box-shadow: var(--shadow-sm);

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
                         font-size: 1.1em;
                         margin-bottom: 6px;
                         white-space: nowrap;
                         overflow: hidden;
                         text-overflow: ellipsis;
                    }

                    .item-desc {
                         font-size: 0.85em;
                         color: var(--text-muted);
                         display: flex;
                         flex-direction: column;
                         gap: 2px;

                         p {
                              margin: 0;
                              white-space: nowrap;
                              overflow: hidden;
                              text-overflow: ellipsis;
                         }

                         .item-type {
                              color: #7dd3fc;
                         }
                         .item-tags {
                              color: #fbbf24;
                         }
                         .item-folder {
                              color: #86efac;
                         }
                    }
               }
          }
     }
</style>
