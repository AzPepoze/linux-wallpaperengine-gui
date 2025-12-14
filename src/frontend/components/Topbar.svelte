<script lang="ts">
     import type { Wallpaper } from "../types";

     export let activeWallpaper: Wallpaper | null = null;
     export let screens: string[] = [];
     export let selectedScreen: string | null = null;
     export let onShowSettings: () => void = () => {};
     export let onScreenChange: (screen: string) => void = () => {};

     function handleShowSettings() {
          onShowSettings();
     }

     function handleScreenChange(event: Event) {
          const target = event.target as HTMLSelectElement;
          onScreenChange(target.value);
     }
</script>

<div class="topbar">
     <div class="screen-selector-container">
          <label for="screen-selector">Configure Screen:</label>
          <select
               id="screen-selector"
               on:change={handleScreenChange}
               bind:value={selectedScreen}
          >
               {#each screens as screen}
                    <option value={screen}>{screen}</option>
               {/each}
          </select>
     </div>

     {#if activeWallpaper}
          <p class="current-status">
               Currently using: <strong
                    >{activeWallpaper.projectData?.title ||
                         activeWallpaper.folderName}</strong
               >
               on {selectedScreen}
          </p>
     {/if}
     <button class="settings-button" on:click={handleShowSettings}> ⚙️ </button>
</div>

<style lang="scss">
     .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 15px;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;
     }

     .screen-selector-container {
          display: flex;
          align-items: center;
          gap: 10px;

          label {
               font-weight: bold;
          }

          select {
               background-color: #3a3a3a;
               color: #fff;
               border: 1px solid #444;
               border-radius: 5px;
               padding: 5px 10px;
               font-size: 0.9em;
          }
     }

     .current-status {
          flex-grow: 1;
          text-align: center;
          margin: 0 20px;
     }

     .settings-button {
          background: none;
          border: none;
          font-size: 2em;
          cursor: pointer;
          z-index: 1000;
          color: #fff;
     }
</style>
