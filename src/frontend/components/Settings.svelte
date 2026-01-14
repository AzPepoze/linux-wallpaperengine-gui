<script lang="ts">
     import { onMount } from "svelte";
     import {
          settingsStore,
          loadSettings,
          saveSettings,
          openConfigFile,
          validateBinaryFile,
          showToast,
     } from "../scripts/settings";

     import SettingsSection from "./settings/SettingsSection.svelte";
     import SettingItem from "./ui/SettingItem.svelte";
     import Toggle from "./ui/Toggle.svelte";
     import Input from "./ui/Input.svelte";
     import Select from "./ui/Select.svelte";
     import Range from "./ui/Range.svelte";
     import Browse from "./ui/Browse.svelte";
     // Icons
     import DisplayIcon from "../icons/DisplayIcon.svelte";
     import AudioIcon from "../icons/AudioIcon.svelte";
     import MouseIcon from "../icons/MouseIcon.svelte";
     import SettingIcon from "../icons/SettingIcon.svelte";
     import FolderIcon from "../icons/FolderIcon.svelte";

     const scalingOptions = [
          { value: "default", label: "Default" },
          { value: "stretch", label: "Stretch" },
          { value: "fit", label: "Fit" },
          { value: "fill", label: "Fill" },
     ];

     const clampingOptions = [
          { value: "clamp", label: "Clamp" },
          { value: "border", label: "Border" },
          { value: "repeat", label: "Repeat" },
     ];

     const sections = [
          { id: "general", label: "General", icon: DisplayIcon },
          { id: "audio", label: "Audio", icon: AudioIcon },
          { id: "interaction", label: "Interaction", icon: MouseIcon },
          { id: "advanced", label: "Advanced", icon: SettingIcon },
          { id: "executable", label: "Executable", icon: FolderIcon },
     ];

     let activeSection = "general";
     let contentElement: HTMLElement;

     function scrollToSection(id: string) {
          activeSection = id;
          const element = document.getElementById(id);
          if (element) {
               element.scrollIntoView({ behavior: "smooth" });
          }
     }

     onMount(async () => {
          if (contentElement) {
               const observer = new IntersectionObserver(
                    (entries) => {
                         entries.forEach((entry) => {
                              if (entry.isIntersecting) {
                                   activeSection = entry.target.id;
                              }
                         });
                    },
                    {
                         root: contentElement,
                         threshold: 0.5,
                    },
               );

               sections.forEach((s) => {
                    const el = document.getElementById(s.id);
                    if (el) observer.observe(el);
               });
          }

          await loadSettings();
     });

     const onSelectBinFile = async (path: string) => {
          const isValid = await validateBinaryFile(path);
          if (!isValid) {
               $settingsStore.binaryLocation = "";
          }
     };

     const handleSaveSettings = async () => {
          await saveSettings($settingsStore);
     };

     const handleOpenConfig = async () => {
          await openConfigFile();
     };

     const handleClearAll = async () => {
          if (confirm("Are you sure you want to clear all wallpapers?")) {
               const result = await window.electronAPI.clearAllWallpapers();
               if (result.success) {
                    showToast("All wallpapers cleared", "success");
               } else {
                    showToast(`Error: ${result.error}`, "error");
               }
          }
     };
</script>

<div class="settings-container">
     <aside class="settings-sidebar">
          <div class="sidebar-header">
               <h2>Settings</h2>
               <p>Configure your experience</p>
          </div>
          <nav class="sidebar-nav">
               {#each sections as section}
                    <button
                         class="nav-item"
                         class:active={activeSection === section.id}
                         on:click={() => scrollToSection(section.id)}
                    >
                         <svelte:component
                              this={section.icon}
                              width="18"
                              height="18"
                         />
                         <span>{section.label}</span>
                    </button>
               {/each}
          </nav>

          <div class="sidebar-actions">
               <button class="action-btn primary" on:click={handleSaveSettings}>
                    Save Changes
               </button>
               <button class="action-btn secondary" on:click={handleOpenConfig}>
                    Open Config
               </button>
               <button class="action-btn danger" on:click={handleClearAll}>
                    Clear All
               </button>
          </div>
     </aside>

     <main class="settings-main" bind:this={contentElement}>
          <div class="content-wrapper">
               <SettingsSection
                    title="General"
                    id="general"
                    description="Basic wallpaper engine behavior and performance."
               >
                    <SettingItem
                         label="FPS Limit"
                         id="fps"
                         description="Target frames per second for animations."
                    >
                         <Input
                              type="number"
                              id="fps"
                              bind:value={$settingsStore.fps}
                              min={1}
                         />
                    </SettingItem>

                    <SettingItem
                         label="Scaling Mode"
                         id="scaling"
                         description="How the wallpaper fits the screen."
                    >
                         <Select
                              id="scaling"
                              bind:value={$settingsStore.scaling}
                              options={scalingOptions}
                         />
                    </SettingItem>

                    <SettingItem
                         label="Clamping Mode"
                         id="clamping"
                         description="Texture wrapping behavior."
                    >
                         <Select
                              id="clamping"
                              bind:value={$settingsStore.clamping}
                              options={clampingOptions}
                         />
                    </SettingItem>

                    <SettingItem
                         label="No Fullscreen Pause"
                         id="noFullscreenPause"
                         description="Keep running when other apps are fullscreen."
                    >
                         <Toggle
                              id="noFullscreenPause"
                              bind:checked={$settingsStore.noFullscreenPause}
                         />
                    </SettingItem>

                    <SettingItem
                         label="Disable Particles"
                         id="disableParticles"
                         description="Turn off particle effects to save resources."
                    >
                         <Toggle
                              id="disableParticles"
                              bind:checked={$settingsStore.disableParticles}
                         />
                    </SettingItem>
               </SettingsSection>

               <div class="divider"></div>

               <SettingsSection
                    title="Audio"
                    id="audio"
                    description="Control how audio is handled in wallpapers."
               >
                    <SettingItem
                         label="Silence Wallpaper"
                         id="silence"
                         description="Mute all audio output."
                    >
                         <Toggle
                              id="silence"
                              bind:checked={$settingsStore.silence}
                         />
                    </SettingItem>

                    {#if !$settingsStore.silence}
                         <SettingItem
                              label="Volume"
                              id="volume"
                              description="Adjust master volume level."
                         >
                              <div class="volume-control">
                                   <Range
                                        id="volume"
                                        bind:value={$settingsStore.volume}
                                        min={0}
                                        max={100}
                                   />
                                   <div class="volume-input">
                                        <Input
                                             type="number"
                                             bind:value={$settingsStore.volume}
                                             min={0}
                                             max={100}
                                        />
                                        <span class="unit">%</span>
                                   </div>
                              </div>
                         </SettingItem>

                         <SettingItem
                              label="No Automute"
                              id="noAutomute"
                              description="Prevent automatic muting when not in focus."
                         >
                              <Toggle
                                   id="noAutomute"
                                   bind:checked={$settingsStore.noAutomute}
                              />
                         </SettingItem>

                         <SettingItem
                              label="No Audio Processing"
                              id="noAudioProcessing"
                              description="Disable audio analysis features."
                         >
                              <Toggle
                                   id="noAudioProcessing"
                                   bind:checked={
                                        $settingsStore.noAudioProcessing
                                   }
                              />
                         </SettingItem>
                    {/if}
               </SettingsSection>

               <div class="divider"></div>

               <SettingsSection
                    title="Interaction"
                    id="interaction"
                    description="Customize how you interact with wallpapers."
               >
                    <SettingItem
                         label="Disable Mouse"
                         id="disableMouse"
                         description="Ignore mouse movement and clicks."
                    >
                         <Toggle
                              id="disableMouse"
                              bind:checked={$settingsStore.disableMouse}
                         />
                    </SettingItem>

                    <SettingItem
                         label="Disable Parallax"
                         id="disableParallax"
                         description="Turn off mouse-following parallax effects."
                    >
                         <Toggle
                              id="disableParallax"
                              bind:checked={$settingsStore.disableParallax}
                         />
                    </SettingItem>
               </SettingsSection>

               <div class="divider"></div>

               <SettingsSection
                    title="Advanced"
                    id="advanced"
                    description="Power user options and custom parameters."
               >
                    <SettingItem
                         label="Enable Custom Arguments"
                         id="customArgsEnabled"
                    >
                         <Toggle
                              id="customArgsEnabled"
                              bind:checked={$settingsStore.customArgsEnabled}
                         />
                    </SettingItem>

                    {#if $settingsStore.customArgsEnabled}
                         <SettingItem
                              label="Custom Command Args"
                              id="customArgs"
                              vertical
                              description="Pass raw arguments to the backend."
                         >
                              <Input
                                   type="text"
                                   id="customArgs"
                                   bind:value={$settingsStore.customArgs}
                                   placeholder="e.g. --window 1920x1080"
                              />
                              <p class="help-text">
                                   Refer to
                                   <a
                                        href="https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                   >
                                        linux-wallpaperengine common options
                                   </a>
                              </p>
                         </SettingItem>
                    {/if}
               </SettingsSection>

               <div class="divider"></div>

               <SettingsSection
                    title="Executable"
                    id="executable"
                    description="Set the path to your linux-wallpaperengine binary."
               >
                    <SettingItem
                         label="Binary Location"
                         id="binary"
                         vertical
                         description="Leave empty to use system PATH."
                    >
                         <Browse
                              bind:location={$settingsStore.binaryLocation}
                              onSelect={onSelectBinFile}
                              placeholder="Path to linux-wallpaperengine binary..."
                         />
                    </SettingItem>
               </SettingsSection>
          </div>
     </main>
</div>

<style lang="scss">
     .settings-container {
          display: flex;
          height: 100%;
          width: 100%;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          background: var(--bg-modal);
     }

     .settings-sidebar {
          width: 280px;
          background: rgba(20, 20, 20, 0.6);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 32px 16px;

          .sidebar-header {
               padding: 0 16px 32px;
               h2 {
                    margin: 0;
                    font-size: 1.5em;
                    font-weight: 800;
                    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
               }
               p {
                    margin: 4px 0 0;
                    font-size: 0.85em;
                    color: var(--text-muted);
               }
          }

          .sidebar-nav {
               flex: 1;
               display: flex;
               flex-direction: column;
               gap: 4px;

               .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: var(--transition-base);
                    text-align: left;
                    font-weight: 500;

                    &:hover {
                         background: var(--bg-surface-hover);
                         color: var(--text-color);
                    }

                    &.active {
                         background: var(--btn-primary-bg);
                         color: #fff;
                         box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                    }
               }
          }

          .sidebar-actions {
               display: flex;
               flex-direction: column;
               gap: 10px;
               padding-top: 24px;
               border-top: 1px solid var(--border-color);
          }
     }

     .settings-main {
          flex: 1;
          overflow-y: auto;
          scroll-behavior: smooth;
          position: relative;

          .content-wrapper {
               max-width: 1000px;
               margin: 0 auto;
               padding: 60px 40px 120px;
               display: flex;
               flex-direction: column;
               gap: 48px;
          }
     }

     .divider {
          height: 1px;
          background: linear-gradient(
               90deg,
               transparent,
               var(--border-color),
               transparent
          );
     }

     .volume-control {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;

          .volume-input {
               display: flex;
               align-items: center;
               gap: 8px;
               width: 90px;
               background: var(--bg-surface);
               border-radius: var(--radius-sm);
               padding-right: 12px;
               border: 1px solid var(--border-color);

               :global(input) {
                    border: none !important;
                    background: transparent !important;
                    padding: 8px 0 8px 12px !important;
                    text-align: left;
                    box-shadow: none !important;
                    width: 50px !important;
               }

               .unit {
                    font-size: 0.85em;
                    color: var(--text-muted);
                    font-weight: 600;
               }
          }
     }

     .action-btn {
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 600;
          font-size: 0.9em;
          cursor: pointer;
          transition: var(--transition-base);

          &.primary {
               background: var(--btn-primary-bg);
               color: white;
               &:hover {
                    filter: brightness(1.1);
               }
          }

          &.secondary {
               background: var(--bg-surface);
               color: var(--text-color);
               border: 1px solid var(--border-color);
               &:hover {
                    background: var(--bg-surface-hover);
               }
          }

          &.danger {
               background: transparent;
               color: var(--error-color);
               &:hover {
                    background: rgba(255, 77, 77, 0.1);
               }
          }
     }

     .help-text {
          font-size: 0.8em;
          margin-top: 8px;
          color: var(--text-muted);
          a {
               color: var(--btn-primary-bg);
               text-decoration: none;
               &:hover {
                    text-decoration: underline;
               }
          }
     }
</style>
