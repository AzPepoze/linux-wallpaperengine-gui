<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { formatBytes } from '../../utils/formatHelper';
	import type { Wallpaper } from '../../../shared/types';
	import WallpaperProperties from './WallpaperProperties.svelte';

	export let wallpaper: Wallpaper;
	export let textColor: string = 'var(--text-color)';
	export let palette: [number, number, number][] = [];
	export let fileSize: number | null = null;

	const md = new MarkdownIt();
	let renderedContent = '';

	function parseURLTags(text: string) {
		return text.replace(
			/\[url=([^\]]+)\]([^\[]*?)\[\/url\]/g,
			'[$2]($1)'
		);
	}

	function parseImgTags(text: string) {
		return text.replace(/\[img\]([^\[]+)\[\/img\]/g, '![]($1)');
	}

	$: {
		const { projectData, folderName } = wallpaper;
		const displayFileSize =
			fileSize ||
			(projectData?.file_size
				? parseInt(projectData.file_size)
				: projectData?.fileSize);
		let content = `### ${projectData?.title || folderName}\n\n`;
		content += `*Folder: ${folderName}*\n\n`;

		if (displayFileSize) {
			content += `**Size:** ${formatBytes(displayFileSize)}\n\n`;
		}

		if (projectData?.type) content += `**Type:** ${projectData.type}\n\n`;

		if (projectData?.version)
			content += `**Version:** ${projectData.version}\n\n`;

		if (projectData?.description)
			content += `***\n#### Description:\n${parseImgTags(parseURLTags(projectData.description))}\n\n`;

		if (projectData?.contentrating)
			content += `**Content Rating:** ${projectData.contentrating}\n\n`;

		renderedContent = md.render(content);
	}
</script>

{@html renderedContent}
<WallpaperProperties wallpaperId={wallpaper.folderName} {textColor} {palette} />
