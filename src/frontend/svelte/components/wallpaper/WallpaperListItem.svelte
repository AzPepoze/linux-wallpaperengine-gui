<script lang="ts">
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';
	import { formatBytes, formatDate } from '../../utils/formatHelper';
	import DownloadIcon from '../../icons/DownloadIcon.svelte';
	import CheckIcon from '../../icons/CheckIcon.svelte';
	import {
		downloadStatus,
		downloadProgress,
		subscribe
	} from '../../scripts/workshop';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

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
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
	type="button"
	class="item-container"
	class:selected
	class:in-playlist={inPlaylist}
	class:is-downloaded={isWorkshop && isDownloaded}
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

		{#if isWorkshop && isDownloaded}
			<div class="downloaded-badge-overlay" in:fade>
				<div class="badge-circle">
					<CheckIcon width="14" height="14" strokeWidth="3" />
				</div>
			</div>
		{/if}
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
	{#if isWorkshop}
		<div class="actions">
			{#if isDownloading && !isDownloaded}
				<div
					class="full-row-progress"
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
			{:else if isDownloaded}
				<div
					class="downloaded-check"
					in:scale={{
						start: 0.8,
						duration: 300,
						easing: backOut
					}}
				>
					<CheckIcon width="20" height="20" strokeWidth="3" />
				</div>
			{:else}
				<div
					role="button"
					tabindex="0"
					class="download-badge"
					title="Download"
					on:click|stopPropagation={async () => {
						try {
							await subscribe(folderName);
						} catch (e) {}
					}}
					on:keydown|stopPropagation={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							subscribe(folderName);
						}
					}}
				>
					<DownloadIcon width="20" height="20" />
				</div>
			{/if}
		</div>
	{/if}
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
		width: 100%; /* Ensure button takes full width */
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

			/* Apply purple overlay effect */
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

		.item-preview {
			--size: 100px;

			width: var(--size);
			height: var(--size);
			flex-shrink: 0;
			border-radius: var(--radius-md);
			overflow: hidden;
			background: var(--preview-placeholder-bg);
			box-shadow: var(--shadow-sm);

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
					color: var(
						--stat-tag
					); /* Reusing stat-tag for yellow */
				}

				.item-date {
					color: var(--stat-date);
				}
			}
		}

		.actions {
			display: flex;
			align-items: center;
			justify-content: center;
			padding-left: 10px;
			z-index: 5;

			.download-badge {
				padding: 8px;
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

			.full-row-progress {
				position: absolute;
				inset: 0;
				z-index: 3;
				pointer-events: none;
				border-radius: var(--radius-lg);
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
					opacity: 0.85;
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
						animation: wave-anim-list 3s linear infinite;
						transform: scaleY(
							-1
						); // Re-applied flip for "upside down" peaks
					}
				}

				.center-pct {
					position: relative;
					z-index: 4;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 2px;
					color: white;
					text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);

					.pct {
						font-size: 1.5rem;
						font-weight: 900;
						line-height: 1;
					}

					.label {
						font-size: 0.6rem;
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
						to right,
						rgba(0, 0, 0, 0.3) 0%,
						transparent 100%
					);
					z-index: 2;
				}
			}

			.downloaded-check {
				color: #4caf50;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 8px;
			}
		}

		.downloaded-badge-overlay {
			position: absolute;
			top: 4px;
			right: 4px;
			z-index: 5;

			.badge-circle {
				width: 22px;
				height: 22px;
				border-radius: 50%;
				background: #4caf50;
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
				border: 1.5px solid white;
			}
		}

		@keyframes wave-anim-list {
			from {
				transform: translateX(0);
			}
			to {
				transform: translateX(-50%);
			}
		}
	}
</style>
