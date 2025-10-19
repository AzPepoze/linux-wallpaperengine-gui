<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Wallpaper } from "../types";
	import MarkdownIt from "markdown-it";
	import { getDominantColor, isLight } from "../lib/colorHelper";

	export let selectedWallpaper: Wallpaper | null = null;

	let sidebarContentElement: HTMLDivElement;
	let backgroundColor = "#2a2a2a";
	let textColor = "#fff";

	const dispatch = createEventDispatcher();
	const md = new MarkdownIt();

	$: {
		if (selectedWallpaper && selectedWallpaper.previewData) {
			getDominantColor(selectedWallpaper.previewData).then((dominantColor) => {
				if (dominantColor) {
					backgroundColor = `rgb(${dominantColor.join(",")})`;
					textColor = isLight(dominantColor) ? "#000" : "#fff";
				}
			});
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
		if (projectData?.description) content += `***\n#### Description:\n${projectData.description}\n\n`;
		if (projectData?.contentrating)
			content += `**Content Rating:** ${projectData.contentrating}\n\n`;
		if (projectData?.tags?.length) content += `**Tags:** ${projectData.tags.join(", ")}\n\n`;
		if (projectData?.version) content += `**Version:** ${projectData.version}\n\n`;
		content += `***\n[Workshop URL](steam://url/CommunityFilePage/${folderName})`;

		return md.render(content);
	}

	function close() {
		dispatch("close");
	}
</script>

<div
	class="sidebar"
	class:open={selectedWallpaper}
	style="--background-color: {backgroundColor}; --text-color: {textColor};"
>
	<div class="sidebar-content" bind:this={sidebarContentElement}>
		{#if selectedWallpaper?.previewData}
			<img
				src={selectedWallpaper.previewData}
				alt="{selectedWallpaper.projectData?.title || selectedWallpaper.folderName} preview"
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
		--button-bg-color: #007bff;
		--button-hover-bg-color: #0056b3;
		--button-text-color: #fff;

		width: 0;
		background-color: var(--background-color);
		color: var(--text-color);
		box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
		transition: all 0.3s ease-in-out;
		padding: 0;
		border-radius: 15px;
		margin: 20px 0;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.sidebar-content {
			flex-grow: 1;
			overflow-y: auto;
			padding-bottom: 20px;

			.preview-image {
				width: 100%;
				border-radius: 10px;
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
			width: 300px;
			padding: 0 20px;
			margin: 20px 0 20px 20px;
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
