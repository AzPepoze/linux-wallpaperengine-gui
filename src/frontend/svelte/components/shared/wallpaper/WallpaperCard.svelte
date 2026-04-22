<script lang="ts">
	import { fade, scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import type { WallpaperData, Wallpaper, Playlist } from '@shared/types';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import {
		subscribe,
		downloadProgress,
		downloadStatus,
		subscribedIds,
		isWallpaperFolderExist
	} from '@/scripts/workshop/workshop';
	import { formatBytes } from '@/utils/formatHelper';
	import { onMount } from 'svelte';

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
	export let viewMode: 'grid' | 'list' = 'grid';

	$: selected = selectedWallpaper?.folderName === folderName;
	$: inPlaylist =
		activePlaylist?.items.some((item) => item.includes(folderName)) ||
		false;
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

	onMount(() => {
		if (
			(isWorkshop || isWorkshopItem) &&
			($downloadStatus[folderName] === undefined || isSubscribed)
		) {
			isWallpaperFolderExist(folderName);
		}
	});

	function handleSelect() {
		onSelect(folderName, wallpaper);
	}
</script>

{#if viewMode === 'grid'}
	<div
		role="button"
		tabindex="0"
		class="wallpaper-card grid"
		class:selected
		class:in-playlist={inPlaylist}
		class:is-downloaded={isWorkshopItem && isDownloaded}
		class:is-downloading={isWorkshopItem &&
			isDownloading &&
			!isDownloaded}
		on:click={handleSelect}
		on:keydown={(e) =>
			(e.key === 'Enter' || e.key === ' ') && handleSelect()}
		in:fade={{ duration: isWorkshop ? 0 : 300 }}
		style="animation-delay: {10 + index * 50}ms"
	>
		<div class="preview-container">
			{#if wallpaper.previewPath}
				<img
					src={wallpaper.previewPath}
					alt={wallpaper.projectData?.title}
					class="preview-img"
					loading="lazy"
				/>
			{:else}
				<div class="no-preview">
					<Icon name="image_not_supported" size={80} />
					<span>No Preview</span>
				</div>
			{/if}

			{#if wallpaper.projectData?.approved}
				<div class="badge approved" title="Approved">
					<Icon name="emoji_events" size={22} />
				</div>
			{/if}

			{#if isWorkshopItem && isDownloaded && isSubscribed}
				<div
					class="badge downloaded"
					in:scale={{
						start: 0.8,
						duration: 300,
						easing: backOut
					}}
					out:scale={{ start: 0.5, duration: 200 }}
				>
					<Icon name="check" size={16} />
				</div>
			{/if}

			{#if isWorkshopItem && isDownloading && !isDownloaded}
				<div class="progress-overlay" in:fade>
					<div class="wave-bg" style="height: {percent}%"></div>
					<div class="pct-text">
						{#if percent === 0}
							<div in:scale>
								<Icon name="hourglass_empty" size={32} />
							</div>
						{:else}
							<span class="pct">{percent}%</span>
						{/if}
						<span class="label">
							{percent === 0 ? 'Queued' : 'Downloading'}
						</span>
					</div>
				</div>
			{/if}

			{#if isWorkshop && !isSubscribed && !isDownloading}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="download-btn"
					on:click|stopPropagation={() => subscribe(folderName)}
					in:fly={{ y: 8, duration: 300, easing: backOut }}
				>
					<Icon name="download" size={18} />
				</div>
			{/if}
		</div>
		<span class="title">{wallpaper.projectData?.title || folderName}</span
		>
	</div>
{:else}
	<button
		type="button"
		class="wallpaper-card list"
		class:selected
		class:in-playlist={inPlaylist}
		class:is-downloaded={isWorkshop && isDownloaded}
		class:is-downloading={isWorkshop && isDownloading && !isDownloaded}
		on:click={handleSelect}
		in:scale={{ start: 0.95, duration: 200, easing: backOut }}
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
				<div class="badge-overlay" in:fade>
					<Icon name="check" size={14} />
				</div>
			{/if}
		</div>

		<div class="info">
			<div class="title">
				{wallpaper.projectData?.title || folderName}
			</div>
			<div class="meta">
				{#if isWorkshopItem}
					<div class="stats">
						<span
							>Views: {(
								wallpaper.projectData?.views || 0
							).toLocaleString()}</span
						>
						<span
							>Subs: {(
								wallpaper.projectData?.subscriptions ||
								0
							).toLocaleString()}</span
						>
						{#if wallpaper.projectData?.fileSize}
							<span
								>{formatBytes(
									wallpaper.projectData.fileSize
								)}</span
							>
						{/if}
					</div>
				{:else}
					<div class="tags">
						{wallpaper.projectData?.type || ''} • {wallpaper.projectData?.tags?.join(
							', '
						) || ''}
					</div>
				{/if}
			</div>
		</div>

		{#if isWorkshop}
			<div class="actions">
				{#if isDownloading && !isDownloaded}
					<div class="list-progress" in:fade>
						<div
							class="wave-bg"
							style="height: {percent}%"
						></div>
						<div class="pct-text">
							{#if percent === 0}
								<Icon name="hourglass_empty" size={16} />
							{:else}
								<span class="pct">{percent}%</span>
							{/if}
						</div>
					</div>
				{:else if isSubscribed && isDownloaded}
					<div class="check" in:scale>
						<Icon name="check" size={20} />
					</div>
				{:else}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="download-btn"
						on:click|stopPropagation={() =>
							subscribe(folderName)}
					>
						<Icon name="download" size={20} />
					</div>
				{/if}
			</div>
		{/if}
	</button>
{/if}

<style lang="scss">
	.wallpaper-card {
		position: relative;
		transition: all 0.2s ease-out;
		cursor: pointer;
		border: 3px solid transparent;
		overflow: hidden;

		&.selected {
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 15px var(--shadow-primary-glow);
		}

		&.in-playlist {
			border: 2px dashed var(--playlist-highlight-border);
			box-shadow: 0 0 15px var(--playlist-highlight);
			&::before {
				content: '';
				position: absolute;
				inset: 0;
				background: var(--playlist-highlight);
				z-index: 2;
				opacity: 0.1;
				pointer-events: none;
			}
		}

		.no-preview {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			color: var(--text-muted);
			font-size: 0.9em;
			gap: 6px;
			opacity: 0.5;
		}

		&.grid {
			width: 170px;
			height: 170px;
			border-radius: 15px;
			background: var(--item-bg-translucent);

			.preview-container {
				width: 100%;
				height: 100%;
				position: relative;
			}

			.preview-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: 12px;
			}

			.no-preview {
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				background: var(--bg-surface-hover);
				border-radius: 12px;
				color: var(--text-muted);
				gap: 8px;

				span {
					font-size: 0.8rem;
					font-weight: 600;
					text-transform: uppercase;
					opacity: 0.7;
				}
			}

			.title {
				position: absolute;
				bottom: -10px;
				left: 50%;
				transform: translateX(-50%);
				width: 90%;
				opacity: 0;
				background: var(--text-inverse);
				border-radius: 10px;
				padding: 5px;
				text-align: center;
				font-size: 0.85em;
				transition: all 0.2s;
				z-index: 10;
				border: 2px solid var(--btn-primary-bg);
				filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
			}

			&:hover {
				transform: translateY(-5px);
				.title {
					opacity: 1;
					bottom: 10px;
				}
			}

			.badge {
				position: absolute;
				z-index: 5;
				padding: 4px;
				border-radius: 8px;
				display: flex;
				align-items: center;
				justify-content: center;

				&.approved {
					top: 5px;
					left: 5px;
					filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))
						drop-shadow(0 0 2px rgba(141, 255, 112, 0.8));
				}

				&.downloaded {
					top: 5px;
					right: 5px;
					background: #4caf50;
					color: white;
					border: 2px solid white;
					border-radius: 50%;
				}
			}

			.progress-overlay {
				position: absolute;
				inset: 0;
				z-index: 4;
				background: rgba(0, 0, 0, 0.4);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;

				.wave-bg {
					position: absolute;
					bottom: 0;
					width: 100%;
					background: var(--download-progress);
					opacity: 0.8;
					transition: height 0.4s;

					&::before {
						content: '';
						position: absolute;
						top: -19px;
						left: 0;
						width: 200%;
						height: 20px;
						background: var(--download-progress);
						mask-size: 100% 100%;
						-webkit-mask-size: 100% 100%;
						mask-repeat: repeat-x;
						-webkit-mask-repeat: repeat-x;
						mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z'/%3E%3C/svg%3E");
						-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z'/%3E%3C/svg%3E");
						animation: wave-anim 3s linear infinite;
					}
				}
				.pct-text {
					position: relative;
					z-index: 5;
					color: white;
					text-align: center;
					filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
					.pct {
						font-size: 1.8rem;
						font-weight: 900;
					}
					.label {
						font-size: 0.8rem;
						display: block;
						opacity: 0.9;
						font-weight: 700;
					}
				}
			}

			.download-btn {
				position: absolute;
				top: 8px;
				right: 8px;
				z-index: 10;
				background: var(--badge-bg);
				padding: 6px;
				border-radius: 10px;
				&:hover {
					background: var(--btn-primary-bg);
				}
			}
		}

		&.list {
			display: flex;
			align-items: center;
			gap: 16px;
			padding: 12px;
			width: 100%;
			background: var(--bg-surface);
			border-radius: var(--radius-lg);
			text-align: left;

			.list-thumb {
				width: 80px;
				height: 80px;
				flex-shrink: 0;
				border-radius: 8px;
				position: relative;

				img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 8px;
				}

				.badge-overlay {
					position: absolute;
					top: -5px;
					right: -5px;
					background: #4caf50;
					color: white;
					border-radius: 50%;
					padding: 3px;
					border: 2px solid white;
				}
			}

			.info {
				flex: 1;
				min-width: 0;
				.title {
					font-weight: 600;
					font-size: 1.05em;
					margin-bottom: 4px;
				}
				.meta {
					font-size: 0.85em;
					color: var(--text-muted);
				}
				.stats,
				.tags {
					display: flex;
					gap: 10px;
				}
			}

			.actions {
				width: 50px;
				display: flex;
				justify-content: center;
				.download-btn {
					padding: 8px;
					border-radius: 8px;
					background: var(--badge-bg);
				}
				.check {
					color: #4caf50;
				}
			}
		}
	}

	@keyframes wave-anim {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
