<script lang="ts">
	import { fade, scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';
	import Trophy from '../../icons/Trophy.svelte';
	import DownloadIcon from '../../icons/DownloadIcon.svelte';
	import CheckIcon from '../../icons/CheckIcon.svelte';
	import {
		isDownloaded as checkIsDownloaded,
		subscribe,
		downloadProgress,
		downloadStatus
	} from '../../scripts/workshop';

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

	$: isDownloaded = $downloadStatus[folderName];

	$: progress = $downloadProgress[folderName];
	$: isDownloading = !!progress;
	$: percent =
		progress && progress.total > 0
			? Math.round(
					(Number(progress.current) / Number(progress.total)) *
						100
				)
			: 0;

	import { onMount } from 'svelte';
	onMount(() => {
		if (isWorkshop) {
			checkIsDownloaded(folderName);
		}
	});
</script>

<button
	type="button"
	class="wallpaper-item"
	class:selected
	class:in-playlist={inPlaylist}
	class:is-downloaded={isDownloaded}
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

		{#if isWorkshop && isDownloaded}
			<div
				class="downloaded-badge"
				title="Downloaded"
				in:scale={{ start: 0.8, duration: 300, easing: backOut }}
			>
				<CheckIcon width="16" height="16" strokeWidth="3" />
			</div>
		{/if}

		{#if isWorkshop && isDownloading && !isDownloaded}
			<div
				class="full-card-progress"
				in:fade={{ duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				<div
					class="progress-wave-bg"
					style="height: {percent}%"
				></div>
				<div
					class="center-pct"
					in:scale={{
						start: 0.8,
						duration: 400,
						delay: 100,
						easing: backOut
					}}
					out:fade={{ duration: 300 }}
				>
					<span class="pct">{percent}%</span>
					<span class="label">Downloading</span>
				</div>
				<div class="progress-overlay"></div>
			</div>
		{/if}

		{#if isWorkshop && !isDownloaded && !isDownloading}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="download-badge"
				title="Download"
				on:click|stopPropagation={async () => {
					try {
						await subscribe(folderName);
					} catch (e) {}
				}}
				in:fly={{ y: 8, duration: 300, easing: backOut }}
			>
				<div class="icon-wrap">
					<DownloadIcon width="18" height="18" />
				</div>
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

		&.is-downloaded {
			border-color: #4caf50;
			box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
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
			top: 8px;
			right: 8px;
			z-index: 10;
			width: 32px;
			height: 32px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--badge-bg);
			color: var(--text-color);
			transition: all 0.2s;
			pointer-events: auto;
			overflow: hidden;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(255, 255, 255, 0.1);

			&:hover {
				background: var(--btn-primary-bg);
				transform: scale(1.1);
			}
		}

		.downloaded-badge {
			position: absolute;
			top: 5px;
			right: 5px;
			z-index: 6;
			width: 28px;
			height: 28px;
			border-radius: 50%;
			background: #4caf50;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			border: 2px solid white;
		}

		.full-card-progress {
			position: absolute;
			inset: 0;
			z-index: 3;
			pointer-events: none;
			border-radius: 12px;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;

			.progress-wave-bg {
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				background: var(--btn-primary-bg);
				opacity: 0.8;
				transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
				z-index: 1;

				&::before {
					content: '';
					position: absolute;
					top: -15px;
					left: 0;
					width: 200%;
					height: 20px;
					background: var(--btn-primary-bg);
					opacity: 1;
					mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z'/%3E%3C/svg%3E");
					mask-size: 100% 100%;
					animation: wave-anim 3s linear infinite;
				}
			}

			.center-pct {
				position: relative;
				z-index: 4;
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 4px;
				color: white;
				text-shadow:
					0 2px 10px rgba(0, 0, 0, 0.8),
					0 0 4px rgba(0, 0, 0, 0.5);

				.pct {
					font-size: 2rem;
					font-weight: 900;
					line-height: 1;
				}

				.label {
					font-size: 0.7rem;
					text-transform: uppercase;
					letter-spacing: 1px;
					font-weight: 700;
					opacity: 0.9;
				}
			}

			.progress-overlay {
				position: absolute;
				inset: 0;
				background: linear-gradient(
					to top,
					rgba(0, 0, 0, 0.5) 0%,
					transparent 100%
				);
				z-index: 2;
			}
		}

		.downloaded-badge {
			position: absolute;
			top: 5px;
			right: 5px;
			z-index: 6;
			width: 28px;
			height: 28px;
			border-radius: 50%;
			background: #4caf50;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			border: 2px solid white;
		}

		@keyframes wave-anim {
			from {
				transform: translateX(0);
			}
			to {
				transform: translateX(-50%);
			}
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
