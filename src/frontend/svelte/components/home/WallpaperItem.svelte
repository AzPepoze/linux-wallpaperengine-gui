<script lang="ts">
	import { fade } from 'svelte/transition';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '@shared/types';
	import {
		downloadProgress,
		downloadStatus,
		subscribedIds,
		isWallpaperFolderExist
	} from '@/scripts/workshop/workshop';
	import WallpaperStatus from '@/components/shared/wallpaper/WallpaperStatus.svelte';

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
	$: isWorkshopItem = !!wallpaper.projectData?.isWorkshop;

	$: isSubscribed = $subscribedIds.has(folderName);
	$: isDownloaded = $downloadStatus[folderName];

	$: progress = $downloadProgress[folderName];
	$: isDownloading = !!progress || (isSubscribed && !isDownloaded);
	$: percent =
		progress && progress.total > 0
			? Math.round(
					(Number(progress.current) / Number(progress.total)) *
						100
				)
			: 0;

	import { onMount } from 'svelte';
	onMount(() => {
		if (
			(isWorkshop || isWorkshopItem) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}
	});
</script>

<div
	role="button"
	tabindex="0"
	class="wallpaper-item"
	class:selected
	class:in-playlist={inPlaylist}
	class:is-downloaded={isWorkshopItem && isDownloaded}
	class:is-downloading={isWorkshopItem && isDownloading && !isDownloaded}
	aria-pressed={selected}
	on:click={() => onSelect(folderName, wallpaper)}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(folderName, wallpaper);
		}
	}}
	in:fade={{ duration: fadeDuration }}
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

		<WallpaperStatus
			{folderName}
			{isWorkshopItem}
			{isSubscribed}
			{isDownloaded}
			{isDownloading}
			{percent}
			approved={!!wallpaper.projectData?.approved}
			layout="grid"
		/>
	</div>

	<span class="wallpaper-name"
		>{wallpaper.projectData?.title || folderName}</span
	>
</div>

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

		&.is-downloaded {
			border-color: #4caf50;
			box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
		}

		&.is-downloading {
			border-color: var(--download-progress);
			box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
		}

		&.in-playlist {
			border: 2px dashed var(--playlist-highlight-border);
			position: relative;
			box-shadow: 0 0 15px var(--playlist-highlight);

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
	}
</style>
