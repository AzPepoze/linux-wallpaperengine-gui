<script lang="ts">
     import type { WallpaperData, Wallpaper } from "../../shared/types";
     import WallpaperItem from "./WallpaperItem.svelte";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let selectedWallpaper: Wallpaper | null = null;
     export let loading: boolean = true;
     export let error: string | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void = () => {};

     function selectWallpaper(folderName: string, wallpaper: WallpaperData) {
          onSelect(folderName, wallpaper);
     }
</script>

<div class="wallpaper-folders">
     {#if loading}
          <div>Loading...</div>
     {:else if error}
          <div style="color: red">{error}</div>
     {:else if Object.keys(wallpapers).length === 0}
          <div>No wallpapers found.</div>
     {:else}
          <div class="wallpaper-grid">
               {#each Object.entries(wallpapers) as [folderName, wallpaper]}
                    <WallpaperItem
                         wallpaper={{ ...wallpaper, folderName }}
                         {folderName}
                         selected={selectedWallpaper?.folderName === folderName}
                         on:click={() => selectWallpaper(folderName, wallpaper)}
                    />
               {/each}
          </div>
     {/if}
</div>

<style lang="scss">
     .wallpaper-folders {
          flex-grow: 1;
          text-align: center;
          transition: width 0.3s ease-in-out;
          overflow-y: auto;
          mask-image: linear-gradient(
               to bottom,
               transparent,
               black 20px,
               black 97%,
               transparent
          );
          width: -webkit-fill-available;

          .wallpaper-grid {
               display: flex;
               flex-wrap: wrap;
               gap: 10px;
               padding: 20px;
               justify-content: center;
               list-style: none;
               overflow-y: auto;
          }
     }
</style>
