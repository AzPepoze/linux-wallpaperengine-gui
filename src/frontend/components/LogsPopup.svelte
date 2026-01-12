<script lang="ts">
     import { guiLogs, wallpaperLogs, clearLogs } from "../../backend/logger";
     import { afterUpdate, onMount, tick } from "svelte";
     import Fullscreen from "./ui/Fullscreen.svelte";

     export let onClose: () => void = () => {};
     export let full: boolean = false;

     let guiLogContainer: HTMLDivElement;
     let wallpaperLogContainer: HTMLDivElement;

     let guiAutoScroll = true;
     let wallpaperAutoScroll = true;

     function isAtBottom(element: HTMLDivElement) {
          if (!element) return false;
          const threshold = 50; // tolerance in pixels
          return (
               element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <=
               threshold
          );
     }

     function scrollToBottom(element: HTMLDivElement) {
          if (element) {
               element.scrollTop = element.scrollHeight;
          }
     }

     function handleGuiScroll() {
          if (guiLogContainer) {
               guiAutoScroll = isAtBottom(guiLogContainer);
          }
     }

     function handleWallpaperScroll() {
          if (wallpaperLogContainer) {
               wallpaperAutoScroll = isAtBottom(wallpaperLogContainer);
          }
     }

     // Initial scroll to bottom
     onMount(async () => {
          await tick();
          scrollToBottom(guiLogContainer);
          scrollToBottom(wallpaperLogContainer);
     });

     afterUpdate(() => {
          if (guiAutoScroll) scrollToBottom(guiLogContainer);
          if (wallpaperAutoScroll) scrollToBottom(wallpaperLogContainer);
     });
</script>

{#if full}
     <div class="logs-wrapper full">
          <div class="modal-header">
               <h2>System Logs</h2>
               <div class="header-actions">
                    <button on:click={clearLogs}>Clear Logs</button>
               </div>
          </div>
          <div class="logs-container">
               <div class="log-section">
                    <h3>GUI Logs</h3>
                    <div
                         class="log-box"
                         bind:this={guiLogContainer}
                         on:scroll={handleGuiScroll}
                    >
                         {#each $guiLogs as log}
                              <div class="log-entry">{log}</div>
                         {/each}
                    </div>
               </div>
               <div class="log-section">
                    <h3>Wallpaper Logs</h3>
                    <div
                         class="log-box"
                         bind:this={wallpaperLogContainer}
                         on:scroll={handleWallpaperScroll}
                    >
                         {#each $wallpaperLogs as log}
                              <div class="log-entry">{log}</div>
                         {/each}
                    </div>
               </div>
          </div>
     </div>
{:else}
     <Fullscreen {onClose}>
          <div class="logs-wrapper">
               <div class="modal-header">
                    <h2>System Logs</h2>
                    <div class="header-actions">
                         <button on:click={clearLogs}>Clear Logs</button>
                         <button class="close-button" on:click={onClose}
                              >×</button
                         >
                    </div>
               </div>
               <div class="logs-container">
                    <div class="log-section">
                         <h3>GUI Logs</h3>
                         <div
                              class="log-box"
                              bind:this={guiLogContainer}
                              on:scroll={handleGuiScroll}
                         >
                              {#each $guiLogs as log}
                                   <div class="log-entry">{log}</div>
                              {/each}
                         </div>
                    </div>
                    <div class="log-section">
                         <h3>Wallpaper Logs</h3>
                         <div
                              class="log-box"
                              bind:this={wallpaperLogContainer}
                              on:scroll={handleWallpaperScroll}
                         >
                              {#each $wallpaperLogs as log}
                                   <div class="log-entry">{log}</div>
                              {/each}
                         </div>
                    </div>
               </div>
          </div>
     </Fullscreen>
{/if}

<style lang="scss">
     .logs-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px;
          box-sizing: border-box;
          color: var(--text-color);

          &.full {
               flex-grow: 1;
          }
     }

     .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-shrink: 0;

          h2 {
               margin: 0;
               color: var(--text-color);
          }
     }

     .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;

          button {
               padding: 5px 10px;
               cursor: pointer;
               background-color: var(--btn-secondary-bg);
               border: 1px solid var(--border-color);
               color: var(--text-color);
               border-radius: var(--radius-sm);
               transition: var(--transition-base);

               &:hover {
                    background-color: var(--btn-secondary-hover-bg);
               }
          }

          .close-button {
               background: none;
               border: none;
               font-size: 2em;
               line-height: 1;
               padding: 0 10px;

               &:hover {
                    background-color: transparent;
                    color: var(--error-color);
               }
          }
     }

     .logs-container {
          display: flex;
          gap: 20px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
     }

     .log-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;

          h3 {
               color: var(--text-color);
               opacity: 0.8;
               margin-top: 0;
               margin-bottom: 10px;
               flex-shrink: 0;
          }
     }

     .log-box {
          flex: 1;
          background-color: #1a1a1a;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px;
          overflow: auto; 
          font-family: monospace;
          font-size: 0.9em;
          color: var(--text-muted);
          white-space: pre; 
          text-align: left; 
     }

     .log-entry {
          margin-bottom: 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 2px;
     }
</style>
