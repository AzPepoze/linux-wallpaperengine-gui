<script lang="ts">
     import type { Wallpaper } from "../../shared/types";
     import MarkdownIt from "markdown-it";
     import {
          getDominantColor,
          isLight,
          getPalette,
     } from "../utils/colorHelper";
     import { sidebarWidth } from "../scripts/ui";
     import { onDestroy } from "svelte";
     import WallpaperProperties from "./WallpaperProperties.svelte";

     export let selectedWallpaper: Wallpaper | null = null;
     export let onClose: () => void = () => {};

     let sidebarContentElement: HTMLDivElement;
     let backgroundColor = "#2a2a2a";
     let textColor = "#fff";
     let palette: [number, number, number][] = [];
     let isResizing = false;

     const md = new MarkdownIt();

     $: {
          if (selectedWallpaper && selectedWallpaper.previewData) {
               getDominantColor(selectedWallpaper.previewData).then(
                    (dominantColor) => {
                         if (dominantColor) {
                              backgroundColor = `rgb(${dominantColor.join(",")})`;
                              textColor = isLight(dominantColor)
                                   ? "#000"
                                   : "#fff";
                         }
                    },
               );
               getPalette(selectedWallpaper.previewData, 8).then((p) => {
                    if (p) {
                         palette = p;
                    }
               });
          } else {
               backgroundColor = "#2a2a2a";
               textColor = "#fff";
               palette = [];
          }
     }

     let lastWallpaperId: string | null = null;
     $: if (sidebarContentElement && selectedWallpaper) {
          if (selectedWallpaper.folderName !== lastWallpaperId) {
               sidebarContentElement.scrollTop = 0;
               lastWallpaperId = selectedWallpaper.folderName;
          }
     }

     function getSidebarContent(wallpaper: Wallpaper | null) {
          if (!wallpaper) return "";
          const { projectData, folderName } = wallpaper;

          let content = `### ${projectData?.title || folderName}\n\n`;
          content += `*Folder: ${folderName}*\n\n`;
          if (projectData?.type) content += `*Type: ${projectData.type}*\n\n`;
          if (projectData?.description)
               content += `***\n#### Description:\n${projectData.description}\n\n`;
          if (projectData?.contentrating)
               content += `**Content Rating:** ${projectData.contentrating}\n\n`;
          if (projectData?.tags?.length)
               content += `**Tags:** ${projectData.tags.join(", ")}\n\n`;
          if (projectData?.version)
               content += `**Version:** ${projectData.version}\n\n`;
          content += `***\n[Workshop URL](steam://url/CommunityFilePage/${folderName})

`;

          return md.render(content);
     }

     function close() {
          onClose();
     }

     function startResizing(e: MouseEvent) {
          isResizing = true;
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", stopResizing);
          document.body.style.cursor = "col-resize";
          e.preventDefault();
     }

     function handleMouseMove(e: MouseEvent) {
          if (!isResizing) return;
          const newWidth = window.innerWidth - e.clientX - 40;
          if (newWidth >= 250 && newWidth <= 800) {
               sidebarWidth.set(newWidth);
          }
     }

     function stopResizing() {
          isResizing = false;
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", stopResizing);
          document.body.style.cursor = "default";
     }

     onDestroy(() => {
          stopResizing();
     });
</script>

<div
     class="sidebar"
     class:open={selectedWallpaper}
     class:resizing={isResizing}
     style="
          --sidebar-bg: {backgroundColor};
          --sidebar-text: {textColor};
          --palette-primary: {palette.length > 0
          ? `rgb(${palette[0].join(',')})`
          : 'var(--btn-primary-bg)'};
          --palette-secondary: {palette.length > 1
          ? `rgb(${palette[1].join(',')})`
          : 'var(--btn-secondary-bg)'};
          --palette-track: {palette.length > 2
          ? `rgb(${palette[2].join(',')})`
          : palette.length > 1
            ? `rgb(${palette[1].join(',')})`
            : 'var(--sidebar-text)'};
          width: {selectedWallpaper ? $sidebarWidth + 'px' : '0'};
     "
>
     {#if selectedWallpaper}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
               class="resize-handle"
               class:resizing={isResizing}
               on:mousedown={startResizing}
          ></div>
     {/if}
     <div class="sidebar-content" bind:this={sidebarContentElement}>
          {#if selectedWallpaper?.previewData}
               <img
                    src={selectedWallpaper.previewData}
                    alt="{selectedWallpaper.projectData?.title ||
                         selectedWallpaper.folderName} preview"
                    class="preview-image"
               />
          {/if}
          {@html getSidebarContent(selectedWallpaper)}
          {#if selectedWallpaper}
               <WallpaperProperties
                    wallpaperId={selectedWallpaper.folderName}
                    {textColor}
                    {palette}
               />
          {/if}
     </div>
     <div class="sidebar-footer">
          <button type="button" class="close-btn" on:click={close}>Close</button
          >
     </div>
</div>

<style lang="scss">
     .sidebar {
          /* Dynamic Button Colors from Palette */
          --btn-primary-bg: var(--palette-track);
          --btn-primary-hover-bg: var(--sidebar-text);
          --sidebar-btn-text-final: var(--sidebar-text);
          --text-color: var(--sidebar-text);
          --text-muted: var(--sidebar-text);
          --border-color: var(--sidebar-text);
          --border-color-hover: color-mix(
               in srgb,
               var(--sidebar-text),
               transparent 80%
          );
          --bg-surface: transparent;
          --bg-surface-hover: color-mix(
               in srgb,
               var(--palette-track),
               transparent 80%
          );
          --bg-surface-active: transparent;
          --top-bar-bg: color-mix(in srgb, var(--sidebar-bg), black 20%);
          --bg-dropdown: color-mix(in srgb, var(--sidebar-bg), black 15%);

          width: 0;
          background-color: var(--sidebar-bg);
          color: var(--text-color);
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
          transition: var(--transition-slow);
          border-radius: 15px;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;

          &.resizing {
               transition: none;
          }

          .resize-handle {
               position: absolute;
               left: 0;
               top: 0;
               bottom: 0;
               width: 5px;
               cursor: col-resize;
               z-index: 10;
               transition: var(--transition-base);
               border-radius: var(--radius-md);
               border: 2px dashed var(--btn-secondary-bg);

               &:hover,
               &.resizing {
                    background-color: #007bff;
                    width: 7px;
                    box-shadow: 2px 0 10px #007bff;
               }
          }

          .sidebar-content {
               flex-grow: 1;
               overflow-y: auto;
               overflow-x: hidden;
               padding-bottom: 20px;
               text-align: left;
               border-radius: 15px;

               :global(img) {
                    max-width: 100%;
                    height: auto;
               }

               :global(p) {
                    white-space: pre-wrap;
               }

               .preview-image {
                    width: 500px;
                    max-width: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: var(--radius-md);
                    margin: 20px auto 15px auto;
                    display: block;
                    object-fit: cover;
               }
          }

          .sidebar-footer {
               padding: 10px 0;
               display: flex;
               justify-content: center;
               align-items: center;
               flex-shrink: 0;
               position: relative;
               z-index: 5;
          }

          .close-btn {
               background-color: var(--btn-primary-bg);
               border: none;
               font-size: 1em;
               font-weight: bold;
               cursor: pointer;
               color: var(--sidebar-btn-text-final);
               width: 100%;
               height: 40px;
               border-radius: 25px;
               display: flex;
               justify-content: center;
               align-items: center;
               transition: background-color 0.3s ease;

               &:hover {
                    background-color: var(--btn-primary-hover-bg);
               }
          }

          &.open {
               min-width: 250px;
               max-width: 800px;
               flex-shrink: 0;
               padding: 5px 10px;
               margin: 20px 0 20px 20px;

               .sidebar-content {
                    padding: 0 10px;
               }
          }

          :global(input[type="range"]) {
               background: var(--palette-track) !important;

               &:hover {
                    background: var(--palette-track) !important;
               }
          }

          :global(a) {
               display: inline-block;
               background-color: var(--btn-primary-bg);
               padding: 10px 15px;
               border-radius: 25px;
               text-decoration: none;
               transition: background-color 0.3s ease;
               color: var(--sidebar-btn-text-final);

               &:hover {
                    background-color: var(--btn-primary-hover-bg);
               }
          }
     }
</style>
