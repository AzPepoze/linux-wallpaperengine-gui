<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../../shared/types";
     import { formatBytes, formatDate } from "../../utils/formatHelper";

     export let folderName: string;
     export let wallpaper: WallpaperData;
     export let selectedWallpaper: Wallpaper | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
     class="list-item"
     class:selected={selectedWallpaper?.folderName === folderName}
     on:click={() => onSelect(folderName, wallpaper)}
     role="button"
     tabindex="0"
>
     <div class="item-preview">
          {#if wallpaper.previewPath}
               <img
                    src={wallpaper.previewPath}
                    alt={wallpaper.projectData?.title || folderName}
                    loading="lazy"
                    decoding="async"
               />
          {:else}
               <div class="placeholder"></div>
          {/if}
     </div>
     <div class="item-info">
          <div class="item-title">
               {wallpaper.projectData?.title || folderName}
          </div>
          {#if wallpaper.projectData?.isWorkshop}
               <div class="item-desc">
                    {#if wallpaper.projectData?.description}
                         <p class="item-description">
                              {wallpaper.projectData.description.slice(
                                   0,
                                   100,
                              )}...
                         </p>
                    {/if}
                    <div class="item-stats">
                         <p class="item-views">
                              Views: <span class="stat-value"
                                   >{(
                                        wallpaper.projectData?.views || 0
                                   ).toLocaleString()}</span
                              >
                         </p>
                         <p class="item-subs">
                              Subs: <span class="stat-value"
                                   >{(
                                        wallpaper.projectData?.subscriptions ||
                                        0
                                   ).toLocaleString()}</span
                              >
                         </p>
                         {#if wallpaper.projectData?.fileSize}
                              <p class="item-size">
                                   {formatBytes(wallpaper.projectData.fileSize)}
                              </p>
                         {/if}
                         {#if wallpaper.projectData?.timeUpdated}
                              <p class="item-date">
                                   Updated: {formatDate(
                                        wallpaper.projectData.timeUpdated,
                                   )}
                              </p>
                         {/if}
                    </div>
               </div>
          {:else if wallpaper.projectData?.type}
               <div class="item-desc">
                    <p class="item-type">
                         Type : {wallpaper.projectData.type}
                    </p>
                    <p class="item-tags">
                         Tags : {wallpaper.projectData.tags?.join(", ")}
                    </p>
                    <p class="item-folder">
                         Folder : {folderName}
                    </p>
               </div>
          {/if}
     </div>
</div>

<style lang="scss">
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
                    border-radius: 8px;
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

                    .item-views {
                         color: #60a5fa;
                    }

                    .item-subs {
                         color: #a78bfa;
                    }

                    .item-description {
                         font-size: 0.9em;
                         color: var(--text-muted);
                         margin-bottom: 4px;
                         display: -webkit-box;
                         -webkit-line-clamp: 2;
                         -webkit-box-orient: vertical;
                         white-space: normal;
                    }

                    .item-stats {
                         display: flex;
                         gap: 12px;
                         font-size: 0.85em;
                         align-items: center;

                         p {
                              margin: 0;
                         }
                    }

                    .item-size {
                         color: #fbbf24;
                    }

                    .item-date {
                         color: #94a3b8;
                    }
               }
          }
     }
</style>
