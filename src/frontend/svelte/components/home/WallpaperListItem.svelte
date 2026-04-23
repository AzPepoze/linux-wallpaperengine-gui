<script lang="ts">
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '@shared/types';
	import { formatBytes, formatDate } from '@/utils/formatHelper';
	import {
		downloadStatus,
		downloadProgress,
		subscribedIds,
		isWallpaperFolderExist
	} from '@/scripts/workshop/workshop';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
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

	$: altText = `Preview for ${wallpaper.projectData?.title || folderName}`;
	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;

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

	onMount(() => {
		if (
			(isWorkshop || wallpaper.projectData?.isWorkshop) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
	type="button"
	class="item-container"
	class:selected
	class:in-playlist={inPlaylist}
	class:is-downloaded={isWorkshop && isDownloaded}
	class:is-downloading={isWorkshop && isDownloading && !isDownloaded}
	on:click={() => onSelect(folderName, wallpaper)}
	aria-pressed={selected}
	in:scale={{ start: 0.95, duration: 200, easing: backOut }}
	out:scale={{ start: 0.95, duration: 200, easing: backOut }}
>
	<div class="item-preview">
		{#if wallpaper.previewPath}
			<img
				src={wallpaper.previewPath}
				alt={altText}
				loading={isWorkshop ? undefined : 'lazy'}
				decoding="async"
			/>
		{:else}
			<div class="placeholder"></div>
		{/if}

		<WallpaperStatus
			{folderName}
			isWorkshopItem={isWorkshop}
			{isSubscribed}
			{isDownloaded}
			{isDownloading}
			{percent}
			approved={!!wallpaper.projectData?.approved}
			layout="grid"
		/>
	</div>
	<div class="item-info">
		<div class="item-title">
			{wallpaper.projectData?.title || folderName}
		</div>
		{#if wallpaper.projectData?.isWorkshop}
			<div class="item-desc">
				{#if wallpaper.projectData?.description}
					<p class="item-description">
						{wallpaper.projectData.description.slice(
							0,
							100
						)}...
					</p>
				{/if}
				<div class="item-stats">
					<p class="item-views">
						Views: <span class="stat-value"
							>{(
								wallpaper.projectData?.views || 0
							).toLocaleString()}</span
						>
					</p>
					<p class="item-subs">
						Subs: <span class="stat-value"
							>{(
								wallpaper.projectData?.subscriptions ||
								0
							).toLocaleString()}</span
						>
					</p>
					{#if wallpaper.projectData?.fileSize}
						<p class="item-size">
							{formatBytes(wallpaper.projectData.fileSize)}
						</p>
					{/if}
					{#if wallpaper.projectData?.timeUpdated}
						<p class="item-date">
							Updated: {formatDate(
								wallpaper.projectData.timeUpdated
							)}
						</p>
					{/if}
				</div>
			</div>
		{:else if wallpaper.projectData?.type}
			<div class="item-desc">
				<p class="item-type">
					Type : {wallpaper.projectData.type}
				</p>
				<p class="item-tags">
					Tags : {wallpaper.projectData.tags?.join(', ')}
				</p>
				<p class="item-folder">
					Folder : {folderName}
				</p>
			</div>
		{/if}
	</div>
</button>

<style lang="scss">
	.item-container {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px;
		background: var(--bg-surface);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: var(--transition-base);
		border: 2px solid transparent;
		text-align: left;
		box-sizing: border-box;
		width: 100%;
		position: relative;
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: transparent;
			transition: background 0.3s ease;
			pointer-events: none;
			z-index: 2;
		}

		&:hover {
			background: var(--bg-surface-hover);
			transform: translateX(4px);
			border-color: var(--border-color-hover);
		}

		&:active {
			transform: scale(0.98) translateX(4px);
		}

		&.selected {
			border-color: var(--btn-primary-bg);
			background: var(--bg-primary-translucent);
			box-shadow: var(--shadow-sm);
		}

		&.is-downloaded {
			border-color: #4caf50;
			box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
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

		.item-preview {
			--size: 100px;

			width: var(--size);
			height: var(--size);
			flex-shrink: 0;
			border-radius: var(--radius-md);
			overflow: hidden;
			background: var(--preview-placeholder-bg);
			box-shadow: var(--shadow-sm);
			position: relative;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: 8px;
			}

			.placeholder {
				width: 100%;
				height: 100%;
			}
		}

		.item-info {
			flex-grow: 1;
			min-width: 0;

			.item-title {
				font-weight: 600;
				font-size: 1.1em;
				margin-bottom: 6px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.item-desc {
				font-size: 0.85em;
				color: var(--text-muted);
				display: flex;
				flex-direction: column;
				gap: 2px;

				p {
					margin: 0;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.item-type {
					color: var(--stat-type);
				}
				.item-tags {
					color: var(--stat-tag);
				}
				.item-folder {
					color: var(--stat-folder);
				}

				.item-views {
					color: var(--stat-views);
				}

				.item-subs {
					color: var(--stat-subs);
				}

				.item-description {
					font-size: 0.9em;
					color: var(--text-muted);
					margin-bottom: 4px;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					line-clamp: 2;
					-webkit-box-orient: vertical;
					white-space: normal;
				}

				.item-stats {
					display: flex;
					gap: 12px;
					font-size: 0.85em;
					align-items: center;

					p {
						margin: 0;
					}
				}

				.item-size {
					color: var(--stat-tag);
				}

				.item-date {
					color: var(--stat-date);
				}
			}
		}
	}
</style>
