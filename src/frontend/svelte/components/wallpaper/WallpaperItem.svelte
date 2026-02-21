<script lang="ts">
	import { fade } from 'svelte/transition';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';
	import Trophy from '../../icons/Trophy.svelte';

	export let folderName: string;
	export let wallpaper: WallpaperData;
	export let selectedWallpaper: Wallpaper | null = null;
	export let activePlaylist: Playlist | undefined = undefined;
	export let onSelect: (
		folderName: string,
		wallpaper: WallpaperData
	) => void;
	export let isWorkshop: boolean = false;
	export let index: number = 0;

	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;
	$: fadeDuration = isWorkshop ? 0 : 300;
	$: altText = `Preview for ${wallpaper.projectData?.title || folderName}`;
</script>

<button
	type="button"
	class="wallpaper-item"
	class:selected
	class:in-playlist={inPlaylist}
	aria-pressed={selected}
	on:click={() => onSelect(folderName, wallpaper)}
	style="animation-delay: {10 + index * 50}ms"
>
	<div class="wallpaper-preview-container">
		{#if wallpaper.previewPath}
			<img
				src={wallpaper.previewPath}
				alt={altText}
				class="wallpaper-preview"
				loading={isWorkshop ? undefined : 'lazy'}
				decoding="async"
				in:fade={{ duration: fadeDuration }}
			/>
		{:else}
			<div
				class="wallpaper-preview-placeholder"
				in:fade={{ duration: fadeDuration }}
				out:fade={{ duration: fadeDuration }}
			>
				Loading...
			</div>
		{/if}

		{#if wallpaper.projectData?.approved}
			<div class="approved-badge" title="Approved Wallpaper">
				<Trophy width="18" height="18" />
			</div>
		{/if}
	</div>

	<span class="wallpaper-name"
		>{wallpaper.projectData?.title || folderName}</span
	>
</button>

<style lang="scss">
	.wallpaper-item {
		--item-bg-color: rgba(66, 66, 66, 0.5);
		--wallpaper-name-bg: black;

		width: 170px;
		height: 170px;
		border-radius: 15px;
		background: var(--item-bg-color);
		padding: 0px;
		outline: none;
		position: relative;
		display: flex;
		transition: all 0.2s ease-out;
		overflow: hidden;
		border: 3px solid transparent;
		cursor: pointer;

		/* Setup a pseudo element for tinting */
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: transparent;
			transition: background 0.3s ease;
			pointer-events: none;
			z-index: 2;
		}

		&:hover,
		&:focus {
			transform: translateY(-5px);
			box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
		}

		&.selected,
		&[aria-pressed='true'] {
			border-color: #007bff;
			box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
		}

		&.in-playlist {
			border: 2px dashed var(--playlist-highlight-border); /* Purple border */
			position: relative;
			box-shadow: 0 0 15px var(--playlist-highlight); /* Purple glow */

			/* Add purple tint overlay */
			&::before {
				content: '';
				position: absolute;
				inset: 0;
				background: var(--playlist-highlight);
				pointer-events: none;
				z-index: 2;
				opacity: 1;
			}
		}

		/* Setup base overlay for anim */
		&::before {
			content: '';
			position: absolute;
			inset: 0;
			background: var(--playlist-highlight);
			pointer-events: none;
			z-index: 2;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		.wallpaper-preview-container {
			position: relative;
			width: 100%;
			height: 100%;
			display: flex;
		}

		.wallpaper-preview,
		.wallpaper-preview-placeholder {
			width: 100%;
			height: 100%;
			border-radius: 12px;
			object-fit: cover;
			position: absolute;
			top: 0;
			left: 0;
		}

		.wallpaper-preview-placeholder {
			background-color: var(--preview-placeholder-bg);
		}

		.wallpaper-name {
			background-color: var(--wallpaper-name-bg);
			position: absolute;
			bottom: -10px;
			left: 50%;
			transform: translateX(-50%);
			width: 90%;
			opacity: 0;
			border-radius: 10px;
			font-weight: 500;
			transition: all 0.2s;
			border: 2px solid #007bff;
			padding: 5px;
			text-align: center;
			color: #fff;
		}

		&:hover .wallpaper-name {
			opacity: 1;
			bottom: 10px;
		}

		.approved-badge {
			position: absolute;
			top: 10px;
			left: 10px;
			z-index: 5;
			background: rgba(0, 0, 0, 0.4);
			padding: 4px;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1px solid rgba(190, 255, 178, 0.3);
			pointer-events: none;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		}
	}
</style>
