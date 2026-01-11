<script lang="ts">
     import type { WallpaperData } from "../../shared/types";
     import { fade, scale } from "svelte/transition";
     import { flip } from "svelte/animate";
     import { onMount } from "svelte";
     import {
          screens,
          selectedScreen,
          refreshScreens,
     } from "../scripts/display";

     export let wallpapers: Record<string, WallpaperData> = {};

     onMount(() => {
          refreshScreens();
     });

     async function handleScreenChange(screen: string) {
          selectedScreen.set(screen);
     }

     const scrollOffset = 10;
     function handleWheel(event: WheelEvent) {
          const container = event.currentTarget as HTMLElement;

          const size = container.children[0]?.clientWidth || 150;
          if (event.deltaY > 0) {
               container.scrollLeft += size + scrollOffset;
          }
          if (event.deltaY < 0) {
               container.scrollLeft -= size + scrollOffset;
          }
     }
</script>

{#if Object.keys($screens).length > 0}
     <div class="screens-list" on:wheel={handleWheel}>
          {#each Object.keys($screens) as screen (screen)}
               <!-- svelte-ignore a11y-click-events-have-key-events -->
               <div
                    class="screen-item"
                    class:selected={$selectedScreen === screen}
                    on:click={() => handleScreenChange(screen)}
                    role="button"
                    tabindex="0"
                    in:scale={{ duration: 300, start: 0.8 }}
                    out:fade={{ duration: 200 }}
                    animate:flip={{ duration: 300 }}
               >
                    <div class="screen-preview">
                         {#if $screens[screen]}
                              <img
                                   src={wallpapers[$screens[screen]]
                                        ?.previewData}
                                   alt={screen}
                              />
                         {:else}
                              <div class="placeholder">No Wallpaper</div>
                         {/if}
                    </div>
                    <div class="screen-name">{screen}</div>
               </div>
          {/each}
     </div>
     <hr />
{/if}

<style lang="scss">
     .screens-list {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          padding: 10px;
          justify-content: safe center;

          .screen-item {
               display: flex;
               flex-direction: column;
               align-items: center;
               cursor: pointer;
               opacity: 0.8;
               transition:
                    transform 0.2s,
                    opacity 0.2s,
                    border-color 0.2s,
                    box-shadow 0.2s;
               border: 2px solid transparent;
               padding: 8px;
               border-radius: 12px;
               scroll-snap-align: start;
               background-color: var(--btn-secondary-bg, #2a2a2a);
               box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

               &:hover {
                    opacity: 1;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
               }

               &.selected {
                    opacity: 1;
                    border-color: var(--btn-primary-bg, #007bff);
                    box-shadow: 0 0 0 2px
                         color-mix(
                              in srgb,
                              var(--btn-primary-bg, #007bff),
                              transparent 70%
                         );
               }

               .screen-preview {
                    --size: 150px;

                    width: var(--size);
                    height: var(--size);
                    background-color: #444;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    overflow: hidden;

                    img {
                         width: 100%;
                         height: 100%;
                         object-fit: cover;
                    }

                    .placeholder {
                         font-size: 0.8em;
                         color: #aaa;
                    }
               }

               .screen-name {
                    font-size: 0.9em;
                    font-weight: 600;
                    letter-spacing: 0.5px;
               }
          }
     }
</style>
