<script lang="ts">
  import { onMount } from 'svelte'

  let screen: string = ''
  let fps: number = 60
  let silence: boolean = false
  let message: string | null = null

  onMount(async () => {
    try {
      // @ts-ignore
      const config = await window.api.getConfig()
      if (config.success) {
        screen = config.SCREEN || 'DP-1'
        fps = config.FPS || 60
        silence = config.SILENCE || false
      } else {
        message = `Error loading config: ${config.error}`
      }
    } catch (e) {
      message = `Error loading config: ${e instanceof Error ? e.message : String(e)}`
    }
  })

  const saveSettings = async () => {
    try {
      // @ts-ignore
      const result = await window.api.saveConfig({ SCREEN: screen, FPS: fps, SILENCE: silence })
      if (result.success) {
        message = 'Settings saved successfully!'
      } else {
        message = `Error saving settings: ${result.error}`
      }
    } catch (e) {
      message = `Error saving settings: ${e instanceof Error ? e.message : String(e)}`
    }
  }
</script>

<style>
  .settings-container {
    padding: 20px;
    max-width: 500px;
    margin: 0 auto;
    background-color: #2a2a2a;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    color: #fff;
  }

  .settings-container h2 {
    color: #eee;
    margin-bottom: 20px;
    text-align: center;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input[type="text"],
  .form-group input[type="number"] {
    width: calc(100% - 20px);
    padding: 10px;
    border: 1px solid #444;
    border-radius: 5px;
    background-color: #3a3a3a;
    color: #fff;
  }

  .save-button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease-in-out;
    display: block;
    width: 100%;
    margin-top: 20px;
  }

  .save-button:hover {
    background-color: #0056b3;
  }

  .message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
  }

  .message.success {
    background-color: #28a745;
    color: white;
  }

  .message.error {
    background-color: #dc3545;
    color: white;
  }
</style>

<div class="settings-container">
  <h2>Settings</h2>

  <div class="form-group">
    <label for="screen">Screen:</label>
    <input type="text" id="screen" bind:value={screen} />
  </div>

  <div class="form-group">
    <label for="fps">FPS:</label>
    <input type="number" id="fps" bind:value={fps} min="1" />
  </div>

  <div class="form-group">
    <label for="silence">Silence Wallpaper:</label>
    <input type="checkbox" id="silence" bind:checked={silence} />
  </div>

  <button class="save-button" on:click={saveSettings}>Save Settings</button>

  {#if message}
    <div class="message">{message}</div>
  {/if}
</div>
