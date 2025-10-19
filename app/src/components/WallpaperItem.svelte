<script lang="ts">
	import { fade } from "svelte/transition";
	import type { WallpaperData } from "../types";

	export let wallpaper: WallpaperData;
	export let folderName: string;
	export let selected: boolean;

	const altText = `Preview for ${wallpaper.projectData?.title || folderName}`;
	const fadeDuration = 200; // ms
</script>

<button type="button" class="wallpaper-item" class:selected aria-pressed={selected} on:click>
	<div class="wallpaper-preview-container">
		{#if wallpaper.previewData}
			<img
				src={wallpaper.previewData}
				alt={altText}
				class="wallpaper-preview"
				in:fade={{ duration: fadeDuration }}
			/>
		{:else}
			<div
				class="wallpaper-preview-placeholder"
				in:fade={{ duration: fadeDuration }}
				out:fade={{ duration: fadeDuration }}
			></div>
		{/if}
	</div>

	<span class="wallpaper-name">{wallpaper.projectData?.title || folderName}</span>
</button>

<style lang="scss">
	.wallpaper-item {
		--item-bg-color: #2a2a2a;
		--item-text-color: #fff;
		--item-border-radius: 15px;
		--item-padding: 15px;
		--item-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		--item-hover-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
		--item-selected-border-width: 3px;
		--item-selected-border-color: #007bff;
		--preview-size: 150px;
		--preview-border-radius: 5px;
		--preview-border-color: #444;
		--preview-placeholder-bg: #3a3a3a;
		--transition-duration: 0.2s;

		background-color: var(--item-bg-color);
		color: var(--item-text-color);
		border-radius: var(--item-border-radius);
		overflow: hidden;
		box-shadow: var(--item-shadow);
		transition: all var(--transition-duration);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--item-padding);
		text-align: center;
		border: var(--item-selected-border-width) solid transparent;
		cursor: pointer;
		outline: none;
		font: inherit;
		margin: 0;

		&:hover,
		&:focus {
			transform: translateY(-5px);
			box-shadow: var(--item-hover-shadow);
		}

		&.selected,
		&[aria-pressed="true"] {
			border-color: var(--item-selected-border-color);
			box-shadow: var(--item-hover-shadow);
		}

		.wallpaper-preview-container {
			position: relative;
			width: var(--preview-size);
			height: var(--preview-size);
			margin-bottom: 10px;
		}

		.wallpaper-preview,
		.wallpaper-preview-placeholder {
			width: 100%;
			height: 100%;
			border-radius: var(--preview-border-radius);
			object-fit: cover;
			border: var(--item-selected-border-width) solid var(--preview-border-color);
			position: absolute;
			top: 0;
			left: 0;
		}

		.wallpaper-preview-placeholder {
			background-color: var(--preview-placeholder-bg);
		}

		.wallpaper-name {
			font-size: 1em;
			word-break: break-word;
		}
	}
</style>
