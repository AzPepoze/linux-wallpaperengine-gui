<script lang="ts">
     import Topbar from "./components/Topbar.svelte";
     import Settings from "./components/Settings.svelte";
     import Sidebar from "./components/Sidebar.svelte";
     import WallpaperContainer from "./components/WallpaperContainer.svelte";
     import DisplayManager from "./components/DisplayManager.svelte";
     import * as wallpaperService from "../backend/wallpaperService";
     import * as wallpaperManager from "../backend/wallpaperManager";
     import { logWallpaper, logGui } from "../backend/logger";
     import type { WallpaperData } from "../shared/types";
     import { onMount } from "svelte";
     import { quadOut } from "svelte/easing";
     import { scale } from "svelte/transition";
     import type { TransitionConfig } from "svelte/transition";
     import { showDisplayManager, activeView } from "./scripts/ui";
     import * as display from "./scripts/display";
     import { screens, selectedScreen } from "./scripts/display";
     import LogsPopup from "./components/LogsPopup.svelte";
     import Toast from "./components/ui/Toast.svelte";
     import { toastStore } from "./scripts/settings";

     let wallpapers: Record<string, WallpaperData> = {};
     let error: string | null = null;
     let loading = true;
     let selectedFolderName: string | null = null;
     let activeFolderName: string | null = null;

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

          if (window.electronAPI) {
               window.electronAPI.on("wallpaper-log", (message: string) => {
                    logWallpaper(message);
               });
          }

          display.initDisplay();

          logGui("Application initialized");

          await wallpaperManager.main();

          await wallpaperManager.validateExecutable();

          const {
               wallpapers: loadedWallpapers,
               error: loadError,
               selectedWallpaper: initialWallpaper,
          } = await wallpaperService.loadWallpapers();

          wallpapers = loadedWallpapers;
          error = loadError;

          loading = false;

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

          return initialWallpaper;
     }

     function customSlide(
          node: HTMLElement,
          { delay = 0, duration = 400, easing = quadOut } = {},
     ): TransitionConfig {
          const style = getComputedStyle(node);
          const opacity = +style.opacity;
          const height = node.offsetHeight;

          return {
               delay,
               duration,
               easing,
               css: (t: number) => {
                    const eased = easing(t);
                    return `
                         height: ${eased * height}px;
                         opacity: ${Math.min(t * 2, 1) * opacity};
                    `;
               },
          };
     }

     onMount(async () => {
          const initialWallpaper = await initialize();
          await display.refreshScreens();

          if (!selectedFolderName) {
               if ($selectedScreen && $screens[$selectedScreen]) {
                    activeFolderName = $screens[$selectedScreen];
                    selectedFolderName = activeFolderName;
               } else if (initialWallpaper) {
                    selectedFolderName = initialWallpaper.folderName;
               }
          }
     });

     async function handleSelectWallpaper(folderName: string) {
          if ($selectedScreen) {
               await wallpaperManager.setWallpaper($selectedScreen, folderName);
               activeFolderName = folderName;
               screens.update((s) => ({
                    ...s,
                    [$selectedScreen as string]: folderName,
               }));
          } else {
               console.warn("No screen selected for configuration.");
          }
          selectedFolderName = folderName;
     }

     const pageTransitionInParams = {
          duration: 200,
          delay: 200,
          start: 0.99,
     };

     const pageTransitionOutParams = {
          duration: 200,
          start: 0.99,
     };
</script>

<div class="app-container">
     <Topbar />

     <div class="content">
          {#if $activeView === "wallpapers"}
               <div
                    class="view-container wallpapers-layout"
                    in:scale={pageTransitionInParams}
                    out:scale={pageTransitionOutParams}
               >
                    <div class="workspace">
                         {#if $showDisplayManager}
                              <div
                                   class="display-manager-wrapper"
                                   transition:customSlide={{ duration: 400 }}
                              >
                                   <DisplayManager {wallpapers} />
                              </div>
                         {/if}

                         <WallpaperContainer
                              {wallpapers}
                              {activeWallpaper}
                              {selectedWallpaper}
                              selectedScreen={$selectedScreen}
                              {loading}
                              {error}
                              onSelect={handleSelectWallpaper}
                         />
                    </div>

                    <Sidebar
                         {selectedWallpaper}
                         onClose={() => (selectedFolderName = null)}
                    />
               </div>
          {:else if $activeView === "logs"}
               <div
                    class="view-container"
                    in:scale={pageTransitionInParams}
                    out:scale={pageTransitionOutParams}
               >
                    <LogsPopup full={true} />
               </div>
          {:else if $activeView === "settings"}
               <div
                    class="view-container"
                    in:scale={pageTransitionInParams}
                    out:scale={pageTransitionOutParams}
               >
                    <Settings />
               </div>
          {/if}
     </div>
</div>

{#if $toastStore}
     <Toast message={$toastStore.message} type={$toastStore.type} />
{/if}

<style lang="scss">
     .view-container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          box-sizing: border-box;
          padding: 20px;
     }

     .wallpapers-layout {
          flex-direction: row;
     }

     .workspace {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
     }

     .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
     }

     .content {
          display: flex;
          min-height: 0;
          max-width: 100%;
          flex-grow: 1;
          padding: 10px;
          position: relative;
     }

     .display-manager-wrapper {
          width: 100%;
     }
</style>
