<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../shared/types";
     import { fade } from "svelte/transition";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let selectedWallpaper: Wallpaper | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void;

     const fadeDuration = 200;
</script>

<div class="wallpaper-grid" in:fade={{ duration: 200 }}>
     {#each Object.entries(wallpapers) as [folderName, wallpaper]}
          {@const selected = selectedWallpaper?.folderName === folderName}
          {@const altText = `Preview for ${wallpaper.projectData?.title || folderName}`}
          <button
               type="button"
               class="wallpaper-item"
               class:selected
               aria-pressed={selected}
               on:click={() => onSelect(folderName, wallpaper)}
          >
               <div class="wallpaper-preview-container">
                    {#if wallpaper.previewData}
                         <img
                              src={wallpaper.previewData}
                              alt={altText}
                              class="wallpaper-preview"
                              in:fade={{ duration: fadeDuration }}
                         />
                    {:else}
                         <div
                              class="wallpaper-preview-placeholder"
                              in:fade={{ duration: fadeDuration }}
                              out:fade={{ duration: fadeDuration }}
                         >
                              Loading...
                         </div>
                    {/if}
               </div>

               <span class="wallpaper-name"
                    >{wallpaper.projectData?.title || folderName}</span
               >
          </button>
     {/each}
</div>

<style lang="scss">
     .wallpaper-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding: 20px;
          justify-content: center;
     }

     .wallpaper-item {
          --item-bg-color: rgba(66, 66, 66, 0.5);
          --wallpaper-name-bg: black;

          width: 170px;
          height: 170px;
          border-radius: 5px;
          background: var(--item-bg-color);
          padding: 0px;
          outline: none;
          position: relative;
          display: flex;
          transition: all 0.2s ease-out;
          overflow: hidden;
          border: 1px solid transparent;
          cursor: pointer;

          &:hover,
          &:focus {
               transform: translateY(-5px);
               box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
          }

          &.selected,
          &[aria-pressed="true"] {
               border-color: #007bff;
               box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
          }

          .wallpaper-preview-container {
               position: relative;
               width: 100%;
               height: 100%;
               display: flex;
          }

          .wallpaper-preview,
          .wallpaper-preview-placeholder {
               width: 100%;
               height: 100%;
               border-radius: 5px;
               object-fit: cover;
               position: absolute;
               top: 0;
               left: 0;
          }

          .wallpaper-preview-placeholder {
               background-color: var(--preview-placeholder-bg);
          }

          .wallpaper-name {
               background-color: var(--wallpaper-name-bg);
               position: absolute;
               bottom: -10px;
               left: 50%;
               transform: translateX(-50%);
               width: 90%;
               opacity: 0;
               border-radius: 10px;
               font-weight: 100;
               transition: all 0.2s;
               border: 2px solid #007bff;
               padding: 5px;
               text-align: center;
               color: #fff;
          }

          &:hover .wallpaper-name {
               opacity: 1;
               bottom: 10px;
          }
     }
</style>
