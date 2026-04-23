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
		handleSelect
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
			<div class="verified-badge" title="Approved" in:scale>
				<Icon name="emoji_events" size={14} />
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
		padding: 12px 20px;
		width: 100%;
		background: rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 12px;
		text-align: left;
		color: var(--text-main);
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;

		&:hover {
			background: var(--bg-surface-hover);
			transform: scale(1.005) translateX(4px);
			border-color: rgba(255, 255, 255, 0.1);
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
		}

		&.selected {
			background: var(--bg-surface-selected);
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 20px var(--shadow-primary-glow);
			transform: scale(1.01) translateX(6px);
		}

		.list-thumb {
			width: 100px;
			height: 100px;
			flex-shrink: 0;
			border-radius: 10px;
			position: relative;
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: 10px;
			}

			.badge-overlay {
				position: absolute;
				top: -6px;
				right: -6px;
				background: #4caf50;
				color: white;
				border-radius: 50%;
				padding: 3px;
				border: 2px solid var(--bg-surface);
				box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
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

		.verified-badge {
			position: absolute;
			top: 5px;
			left: 5px;
			z-index: 5;
			filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))
				drop-shadow(0 0 2px rgba(141, 255, 112, 0.8));
			display: flex;
			align-items: center;
			justify-content: center;
			animation: trophy-pulse 2s infinite ease-in-out;
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
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: var(--bg-surface-hover);
				color: var(--text-main);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.2s;
				border: 1px solid rgba(255, 255, 255, 0.1);

				&:hover {
					background: var(--btn-primary-bg);
					transform: scale(1.1);
					box-shadow: 0 0 15px var(--shadow-primary-glow);
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

	@keyframes trophy-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}
</style>
