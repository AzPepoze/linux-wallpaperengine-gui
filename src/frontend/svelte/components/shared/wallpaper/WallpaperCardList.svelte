<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import type { WallpaperData } from '@shared/types';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import { subscribe } from '@/scripts/workshop/workshop';
	import { formatBytes } from '@/utils/formatHelper';

	interface Props {
		folderName: string;
		wallpaper: WallpaperData;
		selected: boolean;
		inPlaylist: boolean;
		isWorkshopItem: boolean;
		isSubscribed: boolean;
		isDownloaded: boolean;
		isDownloading: boolean;
		percent: number;
		isWorkshop: boolean;
		handleSelect: () => void;
		handleContextMenu: (e: MouseEvent) => void;
	}

	let {
		folderName,
		wallpaper,
		selected,
		inPlaylist,
		isWorkshopItem,
		isSubscribed,
		isDownloaded,
		isDownloading,
		percent,
		isWorkshop,
		handleSelect,
		handleContextMenu
	}: Props = $props();
</script>

<div
	role="button"
	tabindex="0"
	class="wallpaper-card list"
	class:selected
	class:in-playlist={inPlaylist}
	class:is-downloaded={isWorkshop && isDownloaded}
	class:is-downloading={isWorkshop && isDownloading && !isDownloaded}
	onclick={handleSelect}
	oncontextmenu={handleContextMenu}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
	in:scale={{ start: 0.98, duration: 200, easing: backOut }}
>
	<div class="preview-container list-thumb">
		{#if wallpaper.previewPath}
			<img src={wallpaper.previewPath} alt="" loading="lazy" />
		{:else}
			<div class="no-preview">
				<Icon name="image_not_supported" size={24} />
			</div>
		{/if}
		{#if isWorkshop && isSubscribed && isDownloaded}
			<div
				class="badge-overlay"
				in:scale={{ duration: 300, easing: backOut }}
			>
				<Icon name="check" size={14} />
			</div>
		{/if}

		{#if wallpaper.projectData?.approved}
			<div class="badge approved" title="Approved" in:scale>
				<Icon name="emoji_events" size={22} />
			</div>
		{/if}
	</div>

	<div class="info">
		<div class="title-row">
			<span
				class="title"
				title={wallpaper.projectData?.title || folderName}
			>
				{wallpaper.projectData?.title || folderName}
			</span>
		</div>

		<div class="meta">
			{#if isWorkshopItem}
				<div class="author-info">
					<Icon name="person" size={14} />
					<span
						>{wallpaper.projectData?.author ||
							'Unknown'}</span
					>
				</div>
				<div class="stats">
					<div class="stat-item">
						<Icon name="visibility" size={14} />
						<span
							>{(
								wallpaper.projectData?.views || 0
							).toLocaleString()}</span
						>
					</div>
					<div class="stat-item">
						<Icon name="favorite" size={14} />
						<span
							>{(
								wallpaper.projectData?.subscriptions ||
								0
							).toLocaleString()}</span
						>
					</div>
					{#if wallpaper.projectData?.fileSize}
						<div class="stat-item">
							<Icon name="description" size={14} />
							<span
								>{formatBytes(
									wallpaper.projectData.fileSize
								)}</span
							>
						</div>
					{/if}
				</div>
			{:else}
				<div class="local-info">
					<span class="type-badge"
						>{wallpaper.projectData?.type || 'Local'}</span
					>
					{#if wallpaper.projectData?.tags?.length}
						<div class="tags">
							{#each wallpaper.projectData.tags.slice(0, 3) as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="actions">
		{#if isWorkshop}
			{#if isDownloading && !isDownloaded}
				<div class="list-progress" in:fade>
					<div class="wave-bg" style="height: {percent}%"></div>
					<div class="pct-text">
						{#if percent === 0}
							<Icon name="hourglass_empty" size={18} />
						{:else}
							<span class="pct">{percent}%</span>
						{/if}
					</div>
				</div>
			{:else if isSubscribed && isDownloaded}
				<div class="status-icon downloaded" in:scale>
					<Icon name="cloud_done" size={22} />
				</div>
			{:else if isSubscribed}
				<div class="status-icon subscribed" in:scale>
					<div in:scale>
						<Icon name="cloud_download" size={22} />
					</div>
				</div>
			{:else}
				<button
					class="download-btn-circle"
					onclick={(e) => {
						e.stopPropagation();
						subscribe(folderName);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.stopPropagation();
							subscribe(folderName);
						}
					}}
					title="Subscribe"
				>
					<Icon name="add" size={22} />
				</button>
			{/if}
		{:else}
			<div class="local-actions">
				{#if selected}
					<div class="active-indicator" in:scale>
						<Icon name="play_circle" size={24} />
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.wallpaper-card.list {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px;
		width: 100%;
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius-md, 8px);
		text-align: left;
		color: var(--text-main);
		border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
		transition: background-color 0.15s ease, border-color 0.15s ease;
		cursor: pointer;

		&:hover {
			background: var(--bg-surface-hover, rgba(255, 255, 255, 0.05));
			border-color: var(--border-color-hover, rgba(255, 255, 255, 0.1));
		}

		&.selected {
			background: var(--btn-primary-bg);
			border-color: var(--btn-primary-bg);
			color: white;

			.title { color: white; }
			.meta { color: rgba(255, 255, 255, 0.9); }
			.stat-item { background: rgba(255, 255, 255, 0.2); }
			.local-info .type-badge { background: white; color: var(--btn-primary-bg); }
			.local-info .tag { background: rgba(255, 255, 255, 0.2); color: white; }
			.status-icon { color: white; }
			.download-btn-circle { color: white; border-color: rgba(255, 255, 255, 0.3); }
			.active-indicator { color: white; filter: none; }
		}

		.list-thumb {
			width: 90px;
			height: 90px;
			flex-shrink: 0;
			border-radius: var(--radius-sm, 6px);
			position: relative;
			background: rgba(0, 0, 0, 0.2);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: var(--radius-sm, 6px);
			}

			.badge-overlay {
				position: absolute;
				top: -4px;
				right: -4px;
				background: var(--success-bg, #4caf50);
				color: white;
				border-radius: 50%;
				padding: 2px;
				border: 2px solid var(--bg-surface);
				z-index: 2;
			}
		}

		.info {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 8px;

			.title {
				font-weight: 600;
				font-size: 1.1rem;
				color: var(--text-main);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.meta {
				display: flex;
				flex-direction: column;
				gap: 6px;
				font-size: 0.85rem;
				color: var(--text-muted);

				.author-info {
					display: flex;
					align-items: center;
					gap: 6px;
					opacity: 0.8;
				}

				.stats {
					display: flex;
					align-items: center;
					gap: 12px;

					.stat-item {
						display: flex;
						align-items: center;
						gap: 4px;
						background: rgba(255, 255, 255, 0.05);
						padding: 2px 8px;
						border-radius: 100px;
					}
				}

				.local-info {
					display: flex;
					align-items: center;
					gap: 12px;

					.type-badge {
						background: var(--btn-primary-bg);
						color: white;
						padding: 2px 8px;
						border-radius: 4px;
						font-size: 0.75rem;
						font-weight: 700;
						text-transform: uppercase;
					}

					.tags {
						display: flex;
						gap: 6px;

						.tag {
							background: rgba(255, 255, 255, 0.1);
							padding: 2px 8px;
							border-radius: 4px;
							font-size: 0.8rem;
						}
					}
				}
			}
		}

		.badge {
			position: absolute;
			z-index: 5;
			display: flex;
			align-items: center;
			justify-content: center;

			&.approved {
				top: 5px;
				left: 5px;
				filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))
					drop-shadow(0 0 2px rgba(141, 255, 112, 0.8));
			}
		}

		.actions {
			width: 80px;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			padding-right: 8px;

			.status-icon {
				&.downloaded {
					color: #4caf50;
				}
				&.subscribed {
					color: var(--btn-primary-bg);
					opacity: 0.7;
				}
			}

			.download-btn-circle {
				width: 36px;
				height: 36px;
				border-radius: var(--radius-md, 6px);
				background: rgba(255, 255, 255, 0.05);
				color: var(--text-main);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.15s ease;
				border: 1px solid rgba(255, 255, 255, 0.1);

				&:hover {
					background: var(--btn-primary-bg);
					border-color: var(--btn-primary-bg);
				}
			}

			.list-progress {
				width: 50px;
				height: 50px;
				border-radius: 50%;
				position: relative;
				overflow: hidden;
				background: rgba(0, 0, 0, 0.2);
				border: 2px solid var(--border-color);

				.wave-bg {
					position: absolute;
					bottom: 0;
					width: 100%;
					background: var(--download-progress);
					opacity: 0.5;
					transition: height 0.3s ease;
				}

				.pct-text {
					position: absolute;
					inset: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: 800;
					font-size: 0.8rem;
					z-index: 2;
					color: white;
					text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
				}
			}

			.active-indicator {
				color: var(--btn-primary-bg);
				filter: drop-shadow(0 0 8px var(--shadow-primary-glow));
			}
		}
	}
</style>
