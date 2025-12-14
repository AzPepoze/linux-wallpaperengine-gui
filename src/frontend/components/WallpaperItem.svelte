<script lang="ts">
     import { fade } from "svelte/transition";
     import type { WallpaperData } from "../types";

     export let wallpaper: WallpaperData;
     export let folderName: string;
     export let selected: boolean;

     const altText = `Preview for ${wallpaper.projectData?.title || folderName}`;
     const fadeDuration = 200;
</script>

<button
     type="button"
     class="wallpaper-item"
     class:selected
     aria-pressed={selected}
     on:click
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
               ></div>
          {/if}
     </div>

     <!-- <span class="wallpaper-name"
          >{wallpaper.projectData?.title || folderName}</span
     > -->
</button>

<style lang="scss">
     .wallpaper-item {
          --item-bg-color: rgba(66, 66, 66, 0.5);
          --item-text-color: #fff;
          --item-padding: 3px;
          --item-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          --item-hover-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
          --item-selected-border-width: 3px;
          --item-selected-border-color: #007bff;
          --preview-border-radius: 20px;
          --preview-placeholder-bg: #3a3a3a;
          --transition-duration: 0.2s;

          width: 170px;
          height: 170px;
          border-radius: var(--preview-border-radius);
          background: var(--item-bg-color);
          padding: 2px;
          border: var(--item-selected-border-width) solid transparent;
          outline: none;

          transition: all var(--transition-duration) ease-out;

          &:hover,
          &:focus {
               transform: translateY(-5px);
               box-shadow: var(--item-hover-shadow);
          }

          &.selected,
          &[aria-pressed="true"] {
               border-color: var(--item-selected-border-color);
               box-shadow: var(--item-hover-shadow);
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
               border-radius: var(--preview-border-radius);
               object-fit: cover;
               position: absolute;
               top: 0;
               left: 0;
          }

          .wallpaper-preview-placeholder {
               background-color: var(--preview-placeholder-bg);
          }

          .wallpaper-name {
               font-size: 1em;
               word-break: break-word;
          }
     }
</style>
