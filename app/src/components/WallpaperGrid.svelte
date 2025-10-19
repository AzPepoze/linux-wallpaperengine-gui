<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Wallpaper, WallpaperData } from "../types";
    import WallpaperItem from "./WallpaperItem.svelte";

    export let wallpapers: Record<string, WallpaperData> = {};
    export let selectedWallpaper: Wallpaper | null = null;
    export let loading: boolean = true;
    export let error: string | null = null;

    const dispatch = createEventDispatcher();

    function selectWallpaper(folderName: string, wallpaper: WallpaperData) {
        dispatch('select', { folderName, wallpaper });
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
                    {wallpaper}
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
        mask-image: linear-gradient(to bottom, transparent, black 20px, black 97%, transparent);

        .wallpaper-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            padding: 20px;
            justify-content: center;
            list-style: none;
            overflow-y: auto;
        }
    }
</style>