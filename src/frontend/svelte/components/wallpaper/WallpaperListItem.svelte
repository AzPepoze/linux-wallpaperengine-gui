<script lang="ts">
	import type {
		WallpaperData,
		Wallpaper,
		Playlist
	} from '../../../shared/types';
	import { formatBytes, formatDate } from '../../utils/formatHelper';
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

	$: altText = `Preview for ${wallpaper.projectData?.title || folderName}`;
	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
	type="button"
	class="item-container"
	class:selected
	class:in-playlist={inPlaylist}
	on:click={() => onSelect(folderName, wallpaper)}
	aria-pressed={selected}
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
				<DownloadIcon width="20" height="20" />
			</div>
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

		&.selected {
			border-color: var(--btn-primary-bg);
			background: var(--bg-primary-translucent);
			box-shadow: var(--shadow-sm);
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
		}
	}
</style>
