<script lang="ts">
	import { fade } from 'svelte/transition';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';
	import Trophy from '../../icons/Trophy.svelte';
	import DownloadIcon from '../../icons/DownloadIcon.svelte';

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

		{#if isWorkshop}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="download-badge"
				title="Download"
				on:click|stopPropagation={() => {
					if (wallpaper.projectData?.publishedfileid) {
						window.electronAPI.openExternal(
							`steam://url/CommunityFilePage/${wallpaper.projectData.publishedfileid}`
						);
					}
				}}
			>
				<DownloadIcon width="18" height="18" />
			</div>
		{/if}
	</div>

	<span class="wallpaper-name"
		>{wallpaper.projectData?.title || folderName}</span
	>
</button>

<style lang="scss">
	.wallpaper-item {
		--item-bg-color: var(--item-bg-translucent);
		--wallpaper-name-bg: var(--text-inverse);

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
			box-shadow: 0 0 15px var(--shadow-primary-glow);
		}

		&.selected,
		&[aria-pressed='true'] {
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 15px var(--shadow-primary-glow);
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
			border: 2px solid var(--btn-primary-bg);
			padding: 5px;
			text-align: center;
			color: var(--text-color);
		}

		&:hover .wallpaper-name {
			opacity: 1;
			bottom: 10px;
		}

		.approved-badge {
			position: absolute;
			top: 5px;
			left: 5px;
			z-index: 5;
			padding: 4px;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			pointer-events: none;
			filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))
				drop-shadow(0 0 2px rgba(141, 255, 112, 0.8));
		}

		.download-badge {
			position: absolute;
			top: 5px;
			right: 5px;
			z-index: 5;
			padding: 6px;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--badge-bg);
			color: var(--text-color);
			transition: all 0.2s;
			pointer-events: auto;

			&:hover {
				background: var(--btn-primary-bg);
				transform: scale(1.1);
			}
		}
	}
</style>
