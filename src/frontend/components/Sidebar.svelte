<script lang="ts">
     import type { Wallpaper } from "../../shared/types";
     import MarkdownIt from "markdown-it";
     import { getDominantColor, isLight } from "../../backend/colorHelper";
     import { sidebarWidth } from "../scripts/ui";
     import { onDestroy } from "svelte";

     export let selectedWallpaper: Wallpaper | null = null;
     export let onClose: () => void = () => {};

     let sidebarContentElement: HTMLDivElement;
     let backgroundColor = "#2a2a2a";
     let textColor = "#fff";
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
          } else {
               backgroundColor = "#2a2a2a";
               textColor = "#fff";
          }
     }

     $: if (sidebarContentElement && selectedWallpaper) {
          sidebarContentElement.scrollTop = 0;
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
          content += `***\n[Workshop URL](steam://url/CommunityFilePage/${folderName})`;

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
     style="--background-color: {backgroundColor}; --text-color: {textColor}; width: {selectedWallpaper
          ? $sidebarWidth + 'px'
          : '0'};"
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
     </div>
     <div class="sidebar-footer">
          <button class="close-btn" on:click={close}>Close</button>
     </div>
</div>

<style lang="scss">
     .sidebar {
          --button-bg-color: var(--btn-primary-bg);
          --button-hover-bg-color: var(--btn-primary-hover-bg);
          --button-text-color: #fff;

          width: 0;
          background-color: var(--background-color);
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
                    background-color: var(--button-bg-color);
                    width: 7px;
                    box-shadow: 2px 0 10px var(--button-bg-color);
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
                    width: 100%;
                    border-radius: var(--radius-md);
                    margin-top: 20px;
                    margin-bottom: 15px;
                    object-fit: cover;
               }
          }

          .sidebar-footer {
               padding: 10px 0;
               display: flex;
               justify-content: center;
               align-items: center;
               flex-shrink: 0;
          }

          .close-btn {
               background-color: var(--button-bg-color);
               border: none;
               font-size: 1em;
               font-weight: bold;
               cursor: pointer;
               color: var(--button-text-color);
               width: 100%;
               height: 40px;
               border-radius: 25px;
               display: flex;
               justify-content: center;
               align-items: center;
               transition: background-color 0.3s ease;

               &:hover {
                    background-color: var(--button-hover-bg-color);
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

          :global(a) {
               display: inline-block;
               background-color: var(--button-bg-color);
               padding: 10px 15px;
               border-radius: 25px;
               text-decoration: none;
               transition: background-color 0.3s ease;
               color: var(--button-text-color);

               &:hover {
                    background-color: var(--button-hover-bg-color);
               }
          }
     }
</style>
