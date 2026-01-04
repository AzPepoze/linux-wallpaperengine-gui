<script lang="ts">
     import Topbar from "./components/Topbar.svelte";
     import Settings from "./components/Settings.svelte";
     import Sidebar from "./components/Sidebar.svelte";
     import WallpaperGrid from "./components/WallpaperGrid.svelte";
     import * as wallpaperService from "../backend/wallpaperService";
     import * as wallpaperManager from "../backend/wallpaperManager";
     import { logWallpaper, logGui } from "../backend/logger";
     import type { WallpaperData } from "../shared/types";

     let wallpapers: Record<string, WallpaperData> = {};
     let error: string | null = null;
     let loading = true;
     let selectedFolderName: string | null = null;
     let activeFolderName: string | null = null;
     let showSettingsPopup: boolean = false;

     let screens: string[] = [];
     let selectedScreenForConfig: string | null = null;

     $: selectedWallpaper = selectedFolderName
          ? {
                 ...wallpapers[selectedFolderName],
                 folderName: selectedFolderName,
            }
          : null;
     $: activeWallpaper = activeFolderName
          ? { ...wallpapers[activeFolderName], folderName: activeFolderName }
          : null;

     async function initialize() {
          loading = true;

          // Setup Logging
          if (window.electronAPI) {
               window.electronAPI.on("wallpaper-log", (message: string) => {
                    logWallpaper(message);
               });
          }

          logGui("Application initialized");

          await wallpaperManager.main();

          const isValidExecutable = await wallpaperManager.validateExecutable();
          if (!isValidExecutable) {
               showSettingsPopup = true;
          }

          const {
               wallpapers: loadedWallpapers,
               error: loadError,
               selectedWallpaper: initialWallpaper,
          } = await wallpaperService.loadWallpapers();

          wallpapers = loadedWallpapers;
          error = loadError;

          const screensResult = await wallpaperManager.getScreens();
          if (screensResult.success && screensResult.screens) {
               screens = screensResult.screens;
               if (screens.length > 0) {
                    selectedScreenForConfig = screens[0];
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

     async function handleSelectWallpaper(folderName: string) {
          if (selectedScreenForConfig) {
               await wallpaperManager.setWallpaper(
                    selectedScreenForConfig,
                    folderName,
               );
               activeFolderName = folderName;
          } else {
               console.warn("No screen selected for configuration.");
          }
          selectedFolderName = folderName;
     }

     function handleScreenChange(screen: string) {
          selectedScreenForConfig = screen;
     }

     initialize();
</script>

<div class="app-container">
     <Topbar
          {activeWallpaper}
          {screens}
          selectedScreen={selectedScreenForConfig}
          onShowSettings={() => (showSettingsPopup = true)}
          onScreenChange={handleScreenChange}
     />

     <div class="content">
          <WallpaperGrid
               {wallpapers}
               {selectedWallpaper}
               {loading}
               {error}
               onSelect={handleSelectWallpaper}
          />
          <Sidebar
               {selectedWallpaper}
               onClose={() => (selectedFolderName = null)}
          />
     </div>

     {#if showSettingsPopup}
          <Settings onClose={() => (showSettingsPopup = false)} />
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
