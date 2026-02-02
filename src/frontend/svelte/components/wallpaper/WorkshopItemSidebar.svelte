<script lang="ts">
     import MarkdownIt from "markdown-it";
     import { formatBytes, formatDate } from "../../utils/formatHelper";
     import type { Wallpaper } from "../../../shared/types";

     export let wallpaper: Wallpaper;

     const md = new MarkdownIt();
     let renderedContent = "";

     function parseURLTags(text: string) {
          return text.replace(
               /\[url=([^\]]+)\]([^\[]*?)\[\/url\]/g,
               "[$2]($1)",
          );
     }

     function parseImgTags(text: string) {
          return text.replace(/\[img\]([^\[]+)\[\/img\]/g, "![]($1)");
     }

     $: {
          const { projectData, folderName } = wallpaper;

          let content = `### ${projectData?.title || folderName}\n\n`;
          content += `**Views:** ${(projectData?.views || 0).toLocaleString()}\n\n`;
          content += `**Subscriptions:** ${(projectData?.subscriptions || 0).toLocaleString()}\n\n`;

          if (projectData?.fileSize)
               content += `**Size:** ${formatBytes(projectData.fileSize)}\n\n`;
          if (projectData?.timeCreated)
               content += `**Created:** ${formatDate(projectData.timeCreated)}\n\n`;
          if (projectData?.timeUpdated)
               content += `**Updated:** ${formatDate(projectData.timeUpdated)}\n\n`;

          if (projectData?.description)
               content += `***\n#### Description:\n${parseImgTags(parseURLTags(projectData.description))}\n\n`;

          if (projectData?.contentrating)
               content += `**Content Rating:** ${projectData.contentrating}\n\n`;

          if (projectData?.tags?.length)
               content += `**Tags:** ${projectData.tags.join(", ")}\n\n`;

          renderedContent = md.render(content);
     }
</script>

<div class="workshop-content">
     {@html renderedContent}
</div>
