<script lang="ts">
     console.log("Running");
     //-------------------------------------------------------
     // Imports
     //-------------------------------------------------------
     import Topbar from "./components/Topbar.svelte";
     import SettingsModal from "./components/SettingsModal.svelte";
     import Sidebar from "./components/Sidebar.svelte";
     import WallpaperGrid from "./components/WallpaperGrid.svelte";
     import * as wallpaperManager from "./core/wallpaperManager";
     import { loadWallpapers } from "./core/wallpaperService";
     import type { WallpaperData } from "./types";

     //-------------------------------------------------------
     // Component State
     //-------------------------------------------------------
     let wallpapers: Record<string, WallpaperData> = {};
     let error: string | null = null;
     let loading = true;
     let selectedFolderName: string | null = null;
     let activeFolderName: string | null = null;
     let showSettingsPopup: boolean = false;

     let screens: string[] = [];
     let selectedScreenForConfig: string | null = null;

     //-------------------------------------------------------
     // Reactive Derivations
     //-------------------------------------------------------
     $: selectedWallpaper = selectedFolderName
          ? {
                 ...wallpapers[selectedFolderName],
                 folderName: selectedFolderName,
            }
          : null;
     $: activeWallpaper = activeFolderName
          ? { ...wallpapers[activeFolderName], folderName: activeFolderName }
          : null;

     //-------------------------------------------------------
     // Helper Functions
     //-------------------------------------------------------
     async function initialize() {
          loading = true;

          const {
               wallpapers: loadedWallpapers,
               error: loadError,
               selectedWallpaper: initialWallpaper,
          } = await loadWallpapers();

          wallpapers = loadedWallpapers;
          error = loadError;

          const screensResult = await wallpaperManager.getScreens();
          if (screensResult.success && screensResult.screens) {
               screens = screensResult.screens;
               if (screens.length > 0) {
                    selectedScreenForConfig = screens[0]; // Select the first screen by default
               }
          } else if (screensResult.error) {
               console.error(`Failed to get screens: ${screensResult.error}`);
               error = `Failed to get screens: ${screensResult.error}`;
          }

          if (initialWallpaper) {
               selectedFolderName = initialWallpaper.folderName;
               activeFolderName = initialWallpaper.folderName;
          }

          loading = false;

          for (const folderName in wallpapers) {
               const wallpaperData = wallpapers[folderName];
               if (wallpaperData.previewPath) {
                    const previewResult =
                         await wallpaperManager.getWallpaperPreview(
                              wallpaperData.previewPath,
                         );
                    if (previewResult.success) {
                         wallpapers[folderName] = {
                              ...wallpapers[folderName],
                              previewData: previewResult.data,
                         };
                    } else {
                         console.error(
                              `Failed to get preview for ${folderName}: ${previewResult.error}`,
                         );
                    }
               }
          }
     }

     async function handleSelectWallpaper(event: CustomEvent) {
          const folderName = event.detail.folderName;
          if (selectedScreenForConfig) {
               await wallpaperManager.setWallpaper(
                    selectedScreenForConfig,
                    folderName,
               );
               // Update active wallpaper for the selected screen
               activeFolderName = folderName; // This needs to be more granular for multi-screen
          } else {
               console.warn("No screen selected for configuration.");
          }
          selectedFolderName = folderName;
     }

     function handleScreenChange(event: CustomEvent<string>) {
          selectedScreenForConfig = event.detail;
     }

     //-------------------------------------------------------
     // Lifecycle Hooks
     //-------------------------------------------------------
     initialize();
</script>

<div class="app-container">
     <Topbar
          {activeWallpaper}
          {screens}
          selectedScreen={selectedScreenForConfig}
          on:showSettings={() => (showSettingsPopup = true)}
          on:screenChanged={handleScreenChange}
     />

     <div class="content">
          <WallpaperGrid
               {wallpapers}
               {selectedWallpaper}
               {loading}
               {error}
               on:select={handleSelectWallpaper}
          />
          <Sidebar
               {selectedWallpaper}
               on:close={() => (selectedFolderName = null)}
          />
     </div>

     {#if showSettingsPopup}
          <SettingsModal on:close={() => (showSettingsPopup = false)} />
     {/if}
</div>

<style lang="scss">
     :global(html, body) {
          height: 100%;
          margin: 0;
          overflow: hidden;
     }

     .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #1e1e1e;
     }

     * {
          color: #fff;
     }

     .content {
          display: flex;
          flex-grow: 1;
          min-height: 0;
     }
</style>
