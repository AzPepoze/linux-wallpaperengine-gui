<script lang="ts">
     import { onMount } from 'svelte'
     import Settings from './components/Settings.svelte'
     import UpdateNotification from './components/UpdateNotification.svelte'
     import MarkdownIt from 'markdown-it'
     import { fly } from 'svelte/transition'

     const md = new MarkdownIt()

     let wallpapers: { folderName: string; previewPath: string | null; projectData: any }[] = []
     let error: string | null = null
     let loading = true
     let selectedWallpaper: {
          folderName: string
          previewPath: string | null
          projectData: any
     } | null = null
     let showSettingsPopup: boolean = false // New state for settings popup

     function getSidebarContent(wallpaper) {
          if (!wallpaper) return ''
          const { projectData, folderName } = wallpaper
          let content = `### ${projectData?.title || folderName}`
          content += `\n*Folder: ${folderName}*`
          if (projectData?.type) content += `\n*Type: ${projectData.type}*`
          if (projectData?.description)
               content += `\n\n**Description:**\n${projectData.description}`
          if (projectData?.contentrating)
               content += `\n\n**Content Rating:** ${projectData.contentrating}`
          if (projectData?.tags?.length) content += `\n\n**Tags:** ${projectData.tags.join(', ')}`
          if (projectData?.version) content += `\n\n**Version:** ${projectData.version}`
          // if (projectData?.workshopid) {
          content += `\n\n[Workshop URL](steam://url/CommunityFilePage/${folderName})`
          // }
          return md.render(content)
     }

     onMount(async () => {
          loading = true
          error = null
          try {
               // @ts-ignore
               const result = await window.api.getWallpapers()
               if (result.success) {
                    wallpapers = result.wallpapers || []
                    // Restore last used wallpaper from localStorage
                    const config = await window.api.getConfig()
                    if (config.success && config.lastUsedWallpaper) {
                         const found = wallpapers.find(
                              (w) => w.folderName === config.lastUsedWallpaper
                         )
                         if (found) {
                              selectedWallpaper = found

                              // Auto set wallpaper on start
                              window.api.setWallpaper(found.folderName)
                         }
                    }
               } else {
                    error = result.error || 'Unknown error'
               }
          } catch (e) {
               error = e instanceof Error ? e.message : String(e)
          } finally {
               loading = false
          }
     })
</script>

<div class="topbar">
     {#if selectedWallpaper}
          <p class="current-status">
               Currently using: <strong
                    >{selectedWallpaper.projectData?.title || selectedWallpaper.folderName}</strong
               >
          </p>
     {/if}
     <button class="settings-button" on:click={() => (showSettingsPopup = true)}> ⚙️ </button>
</div>

<div class="content">
     <div class="wallpaper-folders">
          {#if loading}
               <div>Loading...</div>
          {:else if error}
               <div style="color: red">{error}</div>
          {:else if wallpapers.length === 0}
               <div>No wallpapers found.</div>
          {:else}
               <div class="wallpaper-grid">
                    {#each wallpapers as wallpaper}
                         <button
                              type="button"
                              class="wallpaper-item"
                              class:selected={selectedWallpaper?.folderName ===
                                   wallpaper.folderName}
                              aria-pressed={selectedWallpaper?.folderName === wallpaper.folderName}
                              on:click={async () => {
                                   await window.api.setWallpaper(wallpaper.folderName)
                                   selectedWallpaper = wallpaper
                              }}
                         >
                              {#if wallpaper.previewPath}
                                   <img
                                        src={wallpaper.previewPath}
                                        alt="Preview"
                                        class="wallpaper-preview"
                                   />
                              {/if}
                              <span class="wallpaper-name"
                                   >{wallpaper.projectData?.title || wallpaper.folderName}</span
                              >
                         </button>
                    {/each}
               </div>
          {/if}
     </div>

     <div class="sidebar" class:open={selectedWallpaper}>
          <div class="sidebar-content">
               {@html getSidebarContent(selectedWallpaper)}
          </div>
          <div class="sidebar-footer">
               <button class="close-btn" on:click={() => (selectedWallpaper = null)}>&times;</button
               >
          </div>
     </div>
</div>

{#if showSettingsPopup}
     <div transition:fly class="modal-overlay" on:click={() => (showSettingsPopup = false)}>
          <div class="modal-content" on:click|stopPropagation>
               <button class="modal-close-btn" on:click={() => (showSettingsPopup = false)}>
                    &times;
               </button>
               <Settings />
          </div>
     </div>
{/if}

<UpdateNotification />

<style lang="scss">
     * {
          color: #fff;
     }

     .topbar {
          display: flex;
          justify-content: flex-end;
          padding: 5px;
          width: 100%;
          box-sizing: border-box;
          position: sticky;
     }

     .current-status {
          width: 100%;
          text-align: center;
     }

     .content {
          display: flex;
          flex-grow: 1;
          height: calc(100% - 80px); /* Adjust based on topbar height */
     }

     .settings-button {
          background: none;
          border: none;
          font-size: 2em;
          cursor: pointer;
          z-index: 1000;
          color: #fff;
     }

     .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
     }

     .modal-content {
          background-color: #2a2a2a;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
          position: relative;
          max-width: 500px;
          width: 90%;
          max-height: 90%;
          overflow-y: auto;
     }

     .modal-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #fff;
     }

     .sidebar {
          width: 0;
          background-color: #2a2a2a;
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
          transition: width 0.3s ease-in-out;
          padding: 0 20px;
          border-radius: 15px;
          margin: 20px 0 20px 20px;
          position: relative;
          display: flex; /* Added for flex layout */
          flex-direction: column; /* Added for flex layout */

          .sidebar-content {
               flex-grow: 1;
               overflow-y: auto;
               padding-bottom: 20px; /* Space for the footer */
          }

          .sidebar-footer {
               padding: 10px 0;
               display: flex;
               justify-content: center;
               align-items: center;
               flex-shrink: 0; /* Prevent footer from shrinking */
          }

          .close-btn {
               background-color: #007bff;
               border: none;
               font-size: 24px;
               cursor: pointer;
               color: #fff;
               width: 40px;
               height: 40px;
               border-radius: 50%;
               display: flex;
               justify-content: center;
               align-items: center;
               transition: background-color 0.3s ease;

               &:hover {
                    background-color: #0056b3;
               }
          }

          &.open {
               width: 300px;
          }

          :global(a) {
               display: inline-block;
               background-color: #007bff;
               padding: 10px 15px;
               border-radius: 25px;
               text-decoration: none;
               transition: background-color 0.3s ease;
               color: #fff;

               &:hover {
                    background-color: #0056b3;
               }
          }
     }

     .wallpaper-folders {
          flex-grow: 1;
          text-align: center;
          transition: width 0.3s ease-in-out;
          overflow-y: auto;
          mask-image: linear-gradient(to bottom, transparent, black 20px, black 97%, transparent);

          .wallpaper-grid {
               display: grid;
               grid-template-columns: repeat(
                    auto-fit,
                    minmax(180px, 1fr)
               ); /* Changed to auto-fit for better responsiveness */
               gap: 20px;
               padding: 20px;
               justify-content: center;
               list-style: none;
               overflow-y: auto;
          }

          .wallpaper-item {
               background-color: #2a2a2a;
               border-radius: 15px;
               overflow: hidden;
               box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
               transition: all 0.2s;
               display: flex;
               flex-direction: column;
               align-items: center;
               padding: 15px;
               text-align: center;
               border: none;
               cursor: pointer;
               outline: none;
               font: inherit;
               margin: 0;

               &:hover,
               &:focus {
                    transform: translateY(-5px);
                    box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
               }

               &.selected,
               &[aria-pressed='true'] {
                    border: 3px solid #007bff; /* Highlight color for selected item */
                    box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
               }

               .wallpaper-preview {
                    width: 150px;
                    height: 150px;
                    border-radius: 5px; /* Changed to 5px round */
                    object-fit: cover;
                    margin-bottom: 10px;
                    border: 3px solid #444;
               }

               .wallpaper-name {
                    font-size: 1em;
                    word-break: break-word;
               }
          }
     }
</style>
