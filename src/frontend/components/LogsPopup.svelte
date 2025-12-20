<script lang="ts">
  import { guiLogs, wallpaperLogs, clearLogs } from "../../backend/logger";
  import { afterUpdate, onMount, tick } from "svelte";
  import Fullscreen from "./ui/Fullscreen.svelte";

  export let onClose: () => void;

  let guiLogContainer: HTMLDivElement;
  let wallpaperLogContainer: HTMLDivElement;

  let guiAutoScroll = true;
  let wallpaperAutoScroll = true;

  function isAtBottom(element: HTMLDivElement) {
    if (!element) return false;
    const threshold = 50; // tolerance in pixels
    return (
      element.scrollHeight - element.scrollTop - element.clientHeight <=
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

<Fullscreen {onClose}>
  <div class="logs-wrapper">
    <div class="modal-header">
      <h2>System Logs</h2>
      <div class="header-actions">
        <button on:click={clearLogs}>Clear Logs</button>
        <button class="close-button" on:click={onClose}>×</button>
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

<style lang="scss">
  .logs-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    color: #fff;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;

    h2 {
      margin: 0;
      color: #fff;
    }
  }

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;

    button {
      padding: 5px 10px;
      cursor: pointer;
      background-color: #444;
      border: 1px solid #555;
      color: #fff;
      border-radius: 4px;

      &:hover {
        background-color: #555;
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
        color: #ff6b6b;
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
      color: #ddd;
      margin-top: 0;
      margin-bottom: 10px;
      flex-shrink: 0;
    }
  }

  .log-box {
    flex: 1;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 10px;
    overflow: auto; /* Enable both scrollbars */
    font-family: monospace;
    font-size: 0.9em;
    color: #ccc;
    white-space: pre; /* Disable wrap */
    text-align: left; /* Explicitly align left */
  }

  .log-entry {
    margin-bottom: 4px;
    border-bottom: 1px solid #222;
    padding-bottom: 2px;
  }
</style>
