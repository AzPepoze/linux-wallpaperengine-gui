<script lang="ts">
     import { onMount } from "svelte";
     import DisplayIcon from "../../icons/DisplayIcon.svelte";
     import ApplyAllIcon from "../../icons/ApplyAllIcon.svelte";
     import Button from "../ui/Button.svelte";
     import ViewToggle from "../ui/ViewToggle.svelte";
     import Select from "../ui/Select.svelte";
     import Input from "../ui/Input.svelte";

     import { showDisplayManager } from "../../scripts/ui";
     import { cloneMode, toggleCloneMode } from "../../scripts/display";
     import { settingsStore, showToast } from "../../scripts/settings";
     import { fly } from "svelte/transition";
     import type { WallpaperData, Wallpaper, Playlist } from "../../../shared/types";
     import WallpaperItemGrid from "./WallpaperItemGrid.svelte";
     import WallpaperItemList from "./WallpaperItemList.svelte";

     export let wallpapers: Record<string, WallpaperData> = {};
     export let activeWallpaper: Wallpaper | null = null;
     export let selectedWallpaper: Wallpaper | null = null;
     export let selectedScreen: string | null = null;
     export let loading: boolean = true;
     export let error: string | null = null;
     export let onSelect: (
          folderName: string,
          wallpaper: WallpaperData,
     ) => void = () => {};

     let viewMode: "grid" | "list" | "detail" = "grid";
     let playlists: Playlist[] = [];
     let playlistOptions: { value: string; label: string }[] = [];
     let previousPlaylist = "";
     let previousInterval = 0;
     let isInitialLoad = true;
     let intervalSaveTimeout: number | null = null;

     // Filtered wallpapers based on selected playlist
     $: filteredWallpapers = (() => {
          if (!$settingsStore?.playlist || $settingsStore.playlist === "") {
               return wallpapers;
          }

          const selectedPlaylist = playlists.find(p => p.name === $settingsStore.playlist);
          if (!selectedPlaylist) {
               return wallpapers;
          }

          // Extract workshop IDs from playlist items
          const playlistWallpaperIds = new Set<string>();
          for (const item of selectedPlaylist.items) {
               const pathMatch = item.match(/431960[\/\\](\d+)[\/\\]/);
               if (pathMatch) {
                    playlistWallpaperIds.add(pathMatch[1]);
               }
          }

          // Filter wallpapers to only show those in the playlist
          const filtered: Record<string, WallpaperData> = {};
          for (const [id, data] of Object.entries(wallpapers)) {
               if (playlistWallpaperIds.has(id)) {
                    filtered[id] = data;
               }
          }
          return filtered;
     })();

     onMount(async () => {
          // Load playlists
          try {
               const result = await window.electronAPI.getPlaylists();
               if (result.success && result.playlists) {
                    playlists = result.playlists;
                    playlistOptions = [
                         { value: "", label: "All Wallpapers" },
                         ...playlists.map((p) => ({
                              value: p.name,
                              label: `${p.name} (${p.items.length} wallpapers)`,
                         })),
                    ];
               }
          } catch (err) {
               console.error("Failed to load playlists:", err);
          }

          // Set initial playlist value
          if ($settingsStore) {
               previousPlaylist = $settingsStore.playlist || "";
               previousInterval = $settingsStore.playlistInterval || 0;
          }
          isInitialLoad = false;
     });

     // Watch for playlist changes
     $: if ($settingsStore && $settingsStore.playlist !== previousPlaylist && !isInitialLoad) {
          const newPlaylist = $settingsStore.playlist || "";
          const oldPlaylist = previousPlaylist;
          previousPlaylist = newPlaylist;
          
          // Stop old playlist if it was running
          if (oldPlaylist && oldPlaylist !== "") {
               stopPlaylist();
          }
          
          if (newPlaylist !== "") {
               const selectedPlaylist = playlists.find(p => p.name === newPlaylist);
               if (selectedPlaylist && selectedPlaylist.items.length > 0) {
                    startPlaylistCycling(selectedPlaylist);
               }
          }
     }

     // Track interval changes and save to backend without restarting playlist
     $: if ($settingsStore && $settingsStore.playlistInterval !== previousInterval && !isInitialLoad) {
          previousInterval = $settingsStore.playlistInterval;
          // Debounce saving to avoid saving on every keystroke
          if (intervalSaveTimeout !== null) {
               clearTimeout(intervalSaveTimeout);
          }
          intervalSaveTimeout = window.setTimeout(() => {
               updateIntervalInBackend($settingsStore.playlistInterval);
          }, 500);
     }

     async function updateIntervalInBackend(newInterval: number) {
          try {
               // First save to config
               if ($settingsStore) {
                    await window.electronAPI.saveConfig($settingsStore);
               }
               // Then update the running playlist's interval
               const result = await window.electronAPI.updatePlaylistInterval(newInterval);
               if (!result?.success) {
                    console.warn("Failed to update playlist interval:", result);
               }
          } catch (err) {
               console.error("Failed to update interval:", err);
          }
     }

     async function startPlaylistCycling(playlist: Playlist) {
          try {
               const intervalMinutes = $settingsStore?.playlistInterval || 0;
               
               const result = await window.electronAPI.startPlaylist(playlist.name, intervalMinutes);
               
               if (result.success) {
                    showToast(`Started playlist: ${playlist.name}`, "success");
               } else {
                    showToast(`Failed to start playlist: ${result.error || "Unknown error"}`, "error");
               }
          } catch (err) {
               console.error("Failed to start playlist:", err);
               showToast("Failed to start playlist", "error");
          }
     }

     async function stopPlaylist() {
          try {
               await window.electronAPI.stopPlaylist();
          } catch (err) {
               console.error("Failed to stop playlist:", err);
          }
     }

     function selectWallpaper(folderName: string, wallpaper: WallpaperData) {
          onSelect(folderName, wallpaper);
     }

     async function handleToggleCloneMode() {
          const newMode = !$cloneMode;
          await toggleCloneMode(
               newMode,
               selectedWallpaper?.folderName || activeWallpaper?.folderName,
          );
     }
</script>

<div class="container">
     <div class="toolbar">
          <div class="left-actions">
               {#if playlistOptions.length > 1 && $settingsStore}
                    <div class="playlist-controls">
                         <Select
                              id="playlist"
                              bind:value={$settingsStore.playlist}
                              options={playlistOptions}
                              style="min-width: 200px;"
                         />
                         {#if $settingsStore.playlist && $settingsStore.playlist !== ""}
                              <Input
                                   type="number"
                                   id="playlistInterval"
                                   bind:value={$settingsStore.playlistInterval}
                                   min={0}
                                   max={1440}
                                   placeholder="Interval (min)"
                                   style="width: 120px;"
                              />
                         {/if}
                    </div>
               {/if}
          </div>

          <div class="status-info">
               <div class="status-item">
                    <span class="label">CURRENTLY USING :</span>
                    {#if activeWallpaper}
                         <span
                              in:fly={{ y: 20, duration: 300 }}
                              out:fly={{ y: -20, duration: 300 }}
                              class="value"
                              >{activeWallpaper.projectData?.title ||
                                   activeWallpaper.folderName}</span
                         >
                    {/if}
               </div>
               <div class="status-item">
                    <span class="label">DISPLAY :</span>
                    {#if selectedScreen || $cloneMode}
                         <span
                              in:fly={{ y: 20, duration: 300 }}
                              out:fly={{ y: -20, duration: 300 }}
                              class="value"
                              >{$cloneMode ? "ALL" : selectedScreen}</span
                         >
                    {/if}

                    <Button
                         variant={$showDisplayManager ? "primary" : "secondary"}
                         on:click={() => showDisplayManager.update((v) => !v)}
                         title="Toggle Display Manager"
                         style="padding: 8px; margin-right: 5px; border-radius: 10px;"
                    >
                         <DisplayIcon width="20" height="20" />
                         <span>Display</span>
                    </Button>

                    <Button
                         variant={$cloneMode ? "primary" : "secondary"}
                         on:click={handleToggleCloneMode}
                         title="Clone mode (Apply to all displays)"
                         style="padding: 8px; margin-right: 10px; border-radius: 10px;"
                    >
                         <ApplyAllIcon width="20" height="20" />
                         <span>Clone mode</span>
                    </Button>
               </div>
          </div>

          <div class="mode-toggles">
               <ViewToggle bind:viewMode />
          </div>
     </div>

     <div class="wallpaper-container">
          {#if loading}
               <div class="status-msg">Loading...</div>
          {:else if error}
               <div class="status-msg error">{error}</div>
          {:else if Object.keys(wallpapers).length === 0}
               <div class="status-msg">No wallpapers found.</div>
          {:else if Object.keys(filteredWallpapers).length === 0}
               <div class="status-msg">No wallpapers in this playlist.</div>
          {:else if viewMode === "grid"}
               <WallpaperItemGrid
                    wallpapers={filteredWallpapers}
                    {selectedWallpaper}
                    onSelect={selectWallpaper}
               />
          {:else}
               <WallpaperItemList
                    wallpapers={filteredWallpapers}
                    {selectedWallpaper}
                    onSelect={selectWallpaper}
               />
          {/if}
     </div>
</div>

<style lang="scss">
     .container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          height: 100%;
          min-height: 0;
     }

     .toolbar {
          padding: 10px 15px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          background: var(--top-bar-bg);
          border-radius: 20px;
          gap: 15px;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;

          .left-actions {
               display: flex;
               flex: 1;
               justify-content: flex-start;
               align-items: center;
               gap: 10px;

               .playlist-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
               }
          }

          .status-info {
               display: flex;
               flex-wrap: wrap;
               justify-content: center;
               align-items: center;
               gap: 15px 32px;
               font-size: 0.95em;
               flex: 0 1 auto;

               .status-item {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;

                    .label {
                         color: var(--text-muted);
                         font-weight: 600;
                         letter-spacing: 0.5px;
                         font-size: 0.85em;
                    }

                    .value {
                         color: var(--btn-primary-bg);
                         font-weight: 700;
                         text-transform: uppercase;
                    }
               }
          }

          .mode-toggles {
               display: flex;
               flex: 1;
               justify-content: flex-end;
               gap: 6px;
          }
     }

     .wallpaper-container {
          flex-grow: 1;
          text-align: center;
          overflow-y: auto;
          width: 100%;
          position: relative;
          mask-image: linear-gradient(
               to bottom,
               transparent,
               black 20px,
               black 97%,
               transparent
          );

          .status-msg {
               padding: 40px;
               color: var(--text-muted);
               font-size: 1.1em;

               &.error {
                    color: var(--error-color);
               }
          }
     }
</style>
