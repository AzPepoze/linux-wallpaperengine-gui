<script lang="ts">
     import { onMount, onDestroy } from 'svelte'

     let updateAvailable = false
     let updateDownloaded = false
     let message = ''

     let removeUpdateAvailableListener: () => void
     let removeUpdateDownloadedListener: () => void

     onMount(() => {
          removeUpdateAvailableListener = window.updater.onUpdateAvailable(() => {
               updateAvailable = true
               message = 'A new update is available. Downloading now...'
               console.log('Update available.')
          })

          removeUpdateDownloadedListener = window.updater.onUpdateDownloaded(() => {
               updateDownloaded = true
               message = 'Update downloaded. It will be installed on restart.'
               console.log('Update downloaded.')
          })
     })

     onDestroy(() => {
          if (removeUpdateAvailableListener) removeUpdateAvailableListener()
          if (removeUpdateDownloadedListener) removeUpdateDownloadedListener()
     })

     function restartApp() {
          window.updater.restartAndUpdate()
     }
</script>

{#if updateAvailable}
     <div class="notification-bar">
          <p>{message}</p>
          {#if updateDownloaded}
               <button on:click={restartApp}>Restart and Install</button>
          {/if}
     </div>
{/if}

<style>
     .notification-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: #2c3e50;
          color: white;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
          z-index: 1000;
     }

     .notification-bar p {
          margin: 0;
     }

     .notification-bar button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
     }

     .notification-bar button:hover {
          background-color: #2980b9;
     }
</style>
