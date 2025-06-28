<script lang="ts">
  import { onMount } from 'svelte'
  import Settings from './components/Settings.svelte'
  import MarkdownIt from 'markdown-it'

  const md = new MarkdownIt()

  let wallpapers: { folderName: string; previewPath: string | null; projectData: any }[] = []
  let error: string | null = null
  let loading = true
  let selectedWallpaper: {
    folderName: string
    previewPath: string | null
    projectData: any
  } | null = null
  let isSilenceMode: boolean = false

  function getSidebarContent(wallpaper) {
    if (!wallpaper) return ''
    const { projectData, folderName } = wallpaper
    let content = `### ${projectData?.title || folderName}`
    content += `\n*Folder: ${folderName}*`
    if (projectData?.type) content += `\n*Type: ${projectData.type}*`
    if (projectData?.description) content += `\n\n**Description:**\n${projectData.description}`
    if (projectData?.contentrating)
      content += `\n\n**Content Rating:** ${projectData.contentrating}`
    if (projectData?.tags?.length) content += `\n\n**Tags:** ${projectData.tags.join(', ')}`
    if (projectData?.version) content += `\n\n**Version:** ${projectData.version}`
    if (projectData?.workshopid) {
      content += `\n\n[Workshop URL](${projectData.workshopurl})`
    }
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
        if (config.success) {
          isSilenceMode = config.SILENCE || false
          if (!isSilenceMode && config.lastUsedWallpaper) {
            const found = wallpapers.find((w) => w.folderName === config.lastUsedWallpaper)
            if (found) {
              selectedWallpaper = found
              // Auto set wallpaper on start
              window.api.setWallpaper(found.folderName)
            }
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

<Settings />
<main>
  <div class="wallpaper-folders">
    {#if isSilenceMode}
      <p>Currently using: <strong>Silence Mode</strong></p>
    {:else if selectedWallpaper}
      <p>
        Currently using: <strong
          >{selectedWallpaper.projectData?.title || selectedWallpaper.folderName}</strong
        >
      </p>
    {/if}
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
            class:selected={selectedWallpaper?.folderName === wallpaper.folderName}
            aria-pressed={selectedWallpaper?.folderName === wallpaper.folderName}
            on:click={async () => {
              await window.api.setWallpaper(wallpaper.folderName)
              selectedWallpaper = wallpaper
              isSilenceMode = false // Exit silence mode when a wallpaper is selected
              const configResult = await window.api.getConfig()
              if (configResult.success) {
                const currentConfig = {
                  SCREEN: configResult.SCREEN || 'DP-1',
                  FPS: configResult.FPS || 60,
                  lastUsedWallpaper: wallpaper.folderName,
                  SILENCE: false // Ensure silence is false when a wallpaper is selected
                }
                await window.api.saveConfig(currentConfig)
              }
            }}
          >
            {#if wallpaper.previewPath}
              <img src={wallpaper.previewPath} alt="Preview" class="wallpaper-preview" />
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
    <button class="close-btn" on:click={() => (selectedWallpaper = null)}>&times;</button>
    {@html getSidebarContent(selectedWallpaper)}
  </div>
</main>

<style lang="scss">
  * {
    color: #fff;
  }

  main {
    display: flex;
  }

  .sidebar {
    width: 0;
    background-color: #2a2a2a;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
    transition: width 0.3s ease-in-out;
    padding: 0 20px;
    overflow-y: auto;
    white-space: nowrap;
    border-radius: 15px;
    margin: 20px 0 20px 20px;
    position: relative;

    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
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

      &:hover {
        background-color: #0056b3;
      }
    }
  }

  .wallpaper-folders {
    flex-grow: 1;
    padding: 20px;
    text-align: center;
    transition: width 0.3s ease-in-out;

    .wallpaper-grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(180px, 1fr)
      ); /* Changed to auto-fit for better responsiveness */
      gap: 20px;
      justify-content: center;
      padding: 0;
      list-style: none;
    }

    .wallpaper-item {
      background-color: #2a2a2a;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease-in-out;
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
