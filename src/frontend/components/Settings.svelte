<script lang="ts">
     import { onMount } from "svelte";
     import {
          getConfig,
          saveConfig,
          openConfigInEditor,
          clearAllWallpapers,
     } from "../../backend/wallpaperManager";
     import Fullscreen from "./ui/Fullscreen.svelte";

     import SettingsSection from "./settings/SettingsSection.svelte";
     import SettingItem from "./ui/SettingItem.svelte";
     import Toggle from "./ui/Toggle.svelte";
     import Input from "./ui/Input.svelte";
     import Select from "./ui/Select.svelte";
     import Range from "./ui/Range.svelte";
     import FolderSelector from "./ui/FolderSelector.svelte";

     export let onClose: () => void;

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

     let message: string | null = null;
     let messageType: "success" | "error" | null = null;
     let binaryLocation : string = '';

     onMount(async () => {
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
                    binaryLocation = config.executableLocation ?? '';
               } else {
                    message = `Error loading config: ${config.error}`;
                    messageType = "error";
               }
          } catch (e) {
               message = `Error loading config: ${e instanceof Error ? e.message : String(e)}`;
               messageType = "error";
          }
     });

     const saveSettings = async () => {
          try {
               console.log(binaryLocation);
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
                    noFullscreenPause,
                    executableLocation: binaryLocation
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
               </SettingsSection>

               <SettingsSection title="Audio">
                    <SettingItem label="Silence Wallpaper" id="silence">
                         <Toggle id="silence" bind:checked={silence} />
                    </SettingItem>

                    {#if !silence}
                         <SettingItem label="Volume ({volume}%)" id="volume">
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

               <SettingItem
                    label="Binary location"
                    id="binaryLocation"
               >
                    <FolderSelector bind:location={binaryLocation} />
               </SettingItem>


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
                    on:click={clearAllWallpapers}>Clear All Wallpapers</button
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

<style lang="scss">
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
               background-color 0.2s;
          white-space: nowrap;
     }

     .btn:active {
          transform: scale(0.98);
     }

     .btn-primary {
          background-color: var(--btn-primary-bg);
     }

     .btn-primary:hover {
          background-color: var(--btn-primary-hover-bg);
     }

     .btn-secondary {
          background-color: var(--btn-secondary-bg);
     }

     .btn-secondary:hover {
          background-color: var(--btn-secondary-hover-bg);
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