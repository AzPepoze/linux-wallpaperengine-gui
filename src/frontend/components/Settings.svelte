<script lang="ts">
     import { onMount } from "svelte";
     import {
          getConfig,
          saveConfig,
          openConfigInEditor,
          clearAllWallpapers,
     } from "../../backend/wallpaperManager";
     import { EXECUTABLE_NAME } from "../../shared/constants";
     import Fullscreen from "./ui/Fullscreen.svelte";

     import SettingsSection from "./settings/SettingsSection.svelte";
     import SettingItem from "./ui/SettingItem.svelte";
     import Toggle from "./ui/Toggle.svelte";
     import Input from "./ui/Input.svelte";
     import Select from "./ui/Select.svelte";
     import Range from "./ui/Range.svelte";
     import Browse from "./ui/Browse.svelte";

     export let onClose: () => void = () => {};
     export let full: boolean = false;

     let fps: number = 60;
     let silence: boolean = false;
     let customArgs: string = "";
     let customArgsEnabled: boolean = false;
     let volume: number = 100;
     let noAutomute: boolean = false;
     let noAudioProcessing: boolean = false;
     let scaling: string = "default";
     let clamping: string = "clamp";
     let disableMouse: boolean = false;
     let disableParallax: boolean = false;
     let noFullscreenPause: boolean = false;
     let disableParticles: boolean = false;

     let message: string | null = null;
     let messageType: "success" | "error" | null = null;
     let binaryLocation: string = "";

     const sections = [
          { id: "general", label: "General" },
          { id: "audio", label: "Audio" },
          { id: "interaction", label: "Interaction" },
          { id: "advanced", label: "Advanced" },
          { id: "executable", label: "Executable" },
     ];

     let activeSection = "general";
     let contentElement: HTMLDivElement;

     function scrollToSection(id: string) {
          activeSection = id;
          const element = document.getElementById(id);
          if (element) {
               element.scrollIntoView({ behavior: "smooth" });
          }
     }

     onMount(async () => {
          if (full && contentElement) {
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

          try {
               const config = await getConfig();
               if (config.success) {
                    fps = config.FPS || 60;
                    silence = config.SILENCE || false;
                    customArgs = config.customArgs || "";
                    customArgsEnabled = config.customArgsEnabled || false;
                    volume = config.volume ?? 100;
                    noAutomute = config.noAutomute || false;
                    noAudioProcessing = config.noAudioProcessing || false;
                    scaling = config.scaling || "default";
                    clamping = config.clamping || "clamp";
                    disableMouse = config.disableMouse || false;
                    disableParallax = config.disableParallax || false;
                    noFullscreenPause = config.noFullscreenPause || false;
                    binaryLocation = config.customExecutableLocation || "";
                    disableParticles = config.disableParticles || false;
               } else {
                    message = `Error loading config: ${config.error}`;
                    messageType = "error";
               }
          } catch (e) {
               message = `Error loading config: ${e instanceof Error ? e.message : String(e)}`;
               messageType = "error";
          }
     });

     const onSelectBinFile = async (path: string) => {
          if (!path) return;

          const exists = await window.electronAPI.fsExists(path);
          if (!exists) {
               alert("The selected file does not exist or is not accessible.");
               binaryLocation = "";
               return;
          }

          const fileName = path.split("/").pop();
          if (fileName !== EXECUTABLE_NAME) {
               const confirmSelection = confirm(
                    `The selected file "${fileName}" does not match the expected name "${EXECUTABLE_NAME}". Are you sure you want to use this file?`,
               );
               if (!confirmSelection) {
                    binaryLocation = "";
               }
          }
     };

     const saveSettings = async () => {
          try {
               const result = await saveConfig({
                    FPS: fps,
                    SILENCE: silence,
                    customArgs,
                    customArgsEnabled,
                    volume,
                    noAutomute,
                    noAudioProcessing,
                    scaling,
                    clamping,
                    disableMouse,
                    disableParallax,
                    disableParticles,
                    noFullscreenPause,
                    customExecutableLocation: binaryLocation,
               });
               if (result.success) {
                    message = "Settings saved successfully!";
                    messageType = "success";
               } else {
                    message = `Error saving settings: ${result.error}`;
                    messageType = "error";
               }
          } catch (e) {
               message = `Error saving settings: ${e instanceof Error ? e.message : String(e)}`;
               messageType = "error";
          }
     };

     const openConfig = async () => {
          try {
               const result = await openConfigInEditor();
               if (result.success) {
                    message = "Config file opened!";
                    messageType = "success";
               } else {
                    message = `Failed to open config file: ${result.error}`;
                    messageType = "error";
               }
          } catch (e) {
               message = `Failed to open config file: ${e instanceof Error ? e.message : String(e)}`;
               messageType = "error";
          }
     };

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
</script>

{#if full}
     <div class="settings-layout">
          <nav class="settings-nav">
               <div class="nav-header">
                    <h2>Settings</h2>
               </div>
               <div class="nav-links">
                    {#each sections as section}
                         <button
                              class="nav-link"
                              class:active={activeSection === section.id}
                              on:click={() => scrollToSection(section.id)}
                         >
                              {section.label}
                         </button>
                    {/each}
               </div>

               <div class="nav-footer">
                    <button
                         class="btn btn-primary w-full"
                         on:click={saveSettings}>Save Changes</button
                    >
                    <button
                         class="btn btn-secondary w-full"
                         on:click={openConfig}>Open Config</button
                    >
                    <button
                         class="btn btn-secondary w-full"
                         on:click={clearAllWallpapers}>Clear All</button
                    >
               </div>
          </nav>

          <div class="settings-content" bind:this={contentElement}>
               <div class="sections-list">
                    <SettingsSection title="General" id="general">
                         <SettingItem label="FPS" id="fps">
                              <Input
                                   type="number"
                                   id="fps"
                                   bind:value={fps}
                                   min={1}
                              />
                         </SettingItem>

                         <SettingItem label="Scaling Mode" id="scaling">
                              <Select
                                   id="scaling"
                                   bind:value={scaling}
                                   options={scalingOptions}
                              />
                         </SettingItem>

                         <SettingItem label="Clamping Mode" id="clamping">
                              <Select
                                   id="clamping"
                                   bind:value={clamping}
                                   options={clampingOptions}
                              />
                         </SettingItem>

                         <SettingItem
                              label="No Fullscreen Pause"
                              id="noFullscreenPause"
                         >
                              <Toggle
                                   id="noFullscreenPause"
                                   bind:checked={noFullscreenPause}
                              />
                         </SettingItem>

                         <SettingItem
                              label="Disable particles"
                              id="disableParticles"
                         >
                              <Toggle
                                   id="disableParticles"
                                   bind:checked={disableParticles}
                              />
                         </SettingItem>
                    </SettingsSection>

                    <SettingsSection title="Audio" id="audio">
                         <SettingItem label="Silence Wallpaper" id="silence">
                              <Toggle id="silence" bind:checked={silence} />
                         </SettingItem>

                         {#if !silence}
                              <SettingItem
                                   label="Volume ({volume}%)"
                                   id="volume"
                              >
                                   <Range
                                        id="volume"
                                        bind:value={volume}
                                        min={0}
                                        max={100}
                                   />
                              </SettingItem>

                              <SettingItem label="No Automute" id="noAutomute">
                                   <Toggle
                                        id="noAutomute"
                                        bind:checked={noAutomute}
                                   />
                              </SettingItem>

                              <SettingItem
                                   label="No Audio Processing"
                                   id="noAudioProcessing"
                              >
                                   <Toggle
                                        id="noAudioProcessing"
                                        bind:checked={noAudioProcessing}
                                   />
                              </SettingItem>
                         {/if}
                    </SettingsSection>

                    <SettingsSection title="Interaction" id="interaction">
                         <SettingItem label="Disable Mouse" id="disableMouse">
                              <Toggle
                                   id="disableMouse"
                                   bind:checked={disableMouse}
                              />
                         </SettingItem>

                         <SettingItem
                              label="Disable Parallax"
                              id="disableParallax"
                         >
                              <Toggle
                                   id="disableParallax"
                                   bind:checked={disableParallax}
                              />
                         </SettingItem>
                    </SettingsSection>

                    <SettingsSection title="Advanced" id="advanced">
                         <SettingItem
                              label="Enable Custom Arguments"
                              id="customArgsEnabled"
                         >
                              <Toggle
                                   id="customArgsEnabled"
                                   bind:checked={customArgsEnabled}
                              />
                         </SettingItem>

                         {#if customArgsEnabled}
                              <SettingItem
                                   label="Custom Command Args"
                                   id="customArgs"
                                   vertical
                              >
                                   <Input
                                        type="text"
                                        id="customArgs"
                                        bind:value={customArgs}
                                        placeholder="e.g. --window 1920x1080"
                                   />
                                   <p class="help-text">
                                        Refer to
                                        <a
                                             href="https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options"
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             >linux-wallpaperengine common
                                             options</a
                                        >
                                        for available arguments.
                                   </p>
                              </SettingItem>
                         {/if}
                    </SettingsSection>

                    <SettingsSection
                         title="Executable Location"
                         id="executable"
                    >
                         <Browse
                              bind:location={binaryLocation}
                              onSelect={onSelectBinFile}
                              placeholder="Path to linux-wallpaperengine binary... (Leave empty to use system PATH)"
                         />
                    </SettingsSection>
               </div>

               {#if message}
                    <div
                         class="message"
                         class:success={messageType === "success"}
                         class:error={messageType === "error"}
                    >
                         {message}
                    </div>
               {/if}
          </div>
     </div>
{:else}
     <Fullscreen {onClose}>
          <div class="settings-inner">
               <button class="close-btn" on:click={onClose} aria-label="Close"
                    >&times;</button
               >

               <div class="header">
                    <h2>Settings</h2>
               </div>

               <div class="settings-grid">
                    <SettingsSection title="General">
                         <SettingItem label="FPS" id="fps">
                              <Input
                                   type="number"
                                   id="fps"
                                   bind:value={fps}
                                   min={1}
                              />
                         </SettingItem>

                         <SettingItem label="Scaling Mode" id="scaling">
                              <Select
                                   id="scaling"
                                   bind:value={scaling}
                                   options={scalingOptions}
                              />
                         </SettingItem>

                         <SettingItem label="Clamping Mode" id="clamping">
                              <Select
                                   id="clamping"
                                   bind:value={clamping}
                                   options={clampingOptions}
                              />
                         </SettingItem>

                         <SettingItem
                              label="No Fullscreen Pause"
                              id="noFullscreenPause"
                         >
                              <Toggle
                                   id="noFullscreenPause"
                                   bind:checked={noFullscreenPause}
                              />
                         </SettingItem>

                         <SettingItem
                              label="Disable particles"
                              id="disableParticles"
                         >
                              <Toggle
                                   id="disableParticles"
                                   bind:checked={disableParticles}
                              />
                         </SettingItem>
                    </SettingsSection>

                    <SettingsSection title="Audio">
                         <SettingItem label="Silence Wallpaper" id="silence">
                              <Toggle id="silence" bind:checked={silence} />
                         </SettingItem>

                         {#if !silence}
                              <SettingItem
                                   label="Volume ({volume}%)"
                                   id="volume"
                              >
                                   <Range
                                        id="volume"
                                        bind:value={volume}
                                        min={0}
                                        max={100}
                                   />
                              </SettingItem>

                              <SettingItem label="No Automute" id="noAutomute">
                                   <Toggle
                                        id="noAutomute"
                                        bind:checked={noAutomute}
                                   />
                              </SettingItem>

                              <SettingItem
                                   label="No Audio Processing"
                                   id="noAudioProcessing"
                              >
                                   <Toggle
                                        id="noAudioProcessing"
                                        bind:checked={noAudioProcessing}
                                   />
                              </SettingItem>
                         {/if}
                    </SettingsSection>

                    <SettingsSection title="Interaction">
                         <SettingItem label="Disable Mouse" id="disableMouse">
                              <Toggle
                                   id="disableMouse"
                                   bind:checked={disableMouse}
                              />
                         </SettingItem>

                         <SettingItem
                              label="Disable Parallax"
                              id="disableParallax"
                         >
                              <Toggle
                                   id="disableParallax"
                                   bind:checked={disableParallax}
                              />
                         </SettingItem>
                    </SettingsSection>
               </div>

               <SettingsSection title="Advanced" full={true}>
                    <SettingItem
                         label="Enable Custom Arguments"
                         id="customArgsEnabled"
                    >
                         <Toggle
                              id="customArgsEnabled"
                              bind:checked={customArgsEnabled}
                         />
                    </SettingItem>

                    {#if customArgsEnabled}
                         <SettingItem
                              label="Custom Command Args"
                              id="customArgs"
                              vertical
                         >
                              <Input
                                   type="text"
                                   id="customArgs"
                                   bind:value={customArgs}
                                   placeholder="e.g. --window 1920x1080"
                              />
                              <p class="help-text">
                                   Refer to
                                   <a
                                        href="https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >linux-wallpaperengine common options</a
                                   >
                                   for available arguments.
                              </p>
                         </SettingItem>
                    {/if}
               </SettingsSection>

               <SettingsSection
                    title="Custom linux-wallpaperengine executable location"
                    full={true}
               >
                    <Browse
                         bind:location={binaryLocation}
                         onSelect={onSelectBinFile}
                         placeholder="Path to linux-wallpaperengine binary... (Leave empty to use system PATH)"
                    />
               </SettingsSection>

               <div class="button-group">
                    <button class="btn btn-primary" on:click={saveSettings}
                         >Save Settings</button
                    >
                    <button class="btn btn-secondary" on:click={openConfig}
                         >Open Config File</button
                    >
                    <button
                         class="btn btn-secondary"
                         on:click={clearAllWallpapers}
                         >Clear All Wallpapers</button
                    >
               </div>

               {#if message}
                    <div
                         class="message"
                         class:success={messageType === "success"}
                         class:error={messageType === "error"}
                    >
                         {message}
                    </div>
               {/if}
          </div>
     </Fullscreen>
{/if}

<style lang="scss">
     .settings-layout {
          display: flex;
          height: 100%;
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          overflow: hidden;
          border-radius: 12px;
     }

     .settings-nav {
          width: 250px;
          background: rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 20px;

          .nav-header {
               padding-bottom: 20px;
               border-bottom: 1px solid rgba(255, 255, 255, 0.1);
               h2 {
                    margin: 0;
                    font-size: 1.5em;
               }
          }

          .nav-links {
               display: flex;
               flex-direction: column;
               gap: 5px;
               flex-grow: 1;

               .nav-link {
                    background: transparent;
                    border: none;
                    color: #aaa;
                    text-align: left;
                    padding: 10px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;

                    &:hover {
                         background: rgba(255, 255, 255, 0.05);
                         color: #fff;
                    }

                    &.active {
                         background: var(--btn-primary-bg);
                         color: #fff;
                    }
               }
          }

          .nav-footer {
               display: flex;
               flex-direction: column;
               gap: 10px;
               padding-top: 20px;
               border-top: 1px solid rgba(255, 255, 255, 0.1);

               .w-full {
                    width: 100%;
               }
          }
     }

     .settings-content {
          flex-grow: 1;
          overflow-y: auto;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          scroll-behavior: smooth;

          .sections-list {
               width: 100%;
               max-width: 800px;
               display: flex;
               flex-direction: column;
               gap: 30px;
               padding-bottom: 100px;
          }
     }

     .settings-inner {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          color: var(--text-color);
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding-inline: 20%;
          position: relative; /* For absolute positioning of close btn */

          &.full {
               padding-inline: 10%; /* More space for full view */
          }
     }

     .close-btn {
          position: absolute;
          top: 20px;
          right: 30px;
          background: transparent;
          border: none;
          font-size: 2.5em;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          z-index: 1001;
          transition: all 0.2s ease;
          line-height: 1;
          padding: 5px;
     }

     .close-btn:hover {
          color: #fff;
          transform: scale(1.1);
     }

     .header {
          width: 100%;
          display: flex;
          justify-content: flex-start;
          margin-bottom: 20px;
     }

     h2 {
          font-size: 2em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
     }

     .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
     }

     @media (min-width: 900px) {
          .settings-grid {
               grid-template-columns: 1fr 1fr;
          }
     }

     .button-group {
          margin-top: 40px;
          display: flex;
          flex-direction: row;
          justify-content: center;
          flex-wrap: wrap;
          gap: 15px;
          width: 100%;
     }

     .btn {
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 600;
          transition:
               transform 0.1s,
               filter 0.2s,
               background-color 0.2s,
               border-color 0.2s;
          white-space: nowrap;
     }

     .btn:active {
          transform: scale(0.98);
     }

     .btn-primary {
          background-color: var(--btn-primary-bg);
     }

     .btn-primary:hover {
          filter: brightness(1.2);
     }

     .btn-secondary {
          background-color: var(--btn-secondary-bg);
          border: 1px solid rgba(255, 255, 255, 0.2);
     }

     .btn-secondary:hover {
          filter: brightness(1.5);
          border-color: rgba(255, 255, 255, 0.4);
     }

     .message {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          width: 100%;
          backdrop-filter: blur(5px);
     }

     .message.success {
          background-color: var(--success-bg);
          color: white;
     }

     .message.error {
          background-color: var(--error-bg);
          color: white;
     }

     .help-text {
          font-size: 0.85em;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 5px;
          text-align: left;
     }

     .help-text a {
          color: #5daeff;
          text-decoration: none;
     }

     .help-text a:hover {
          text-decoration: underline;
     }
</style>