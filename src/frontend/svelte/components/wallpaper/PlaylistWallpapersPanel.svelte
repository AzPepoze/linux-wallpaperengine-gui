<script lang="ts">
	import type { Playlist, WallpaperData } from '../../../shared/types';
	import CloseIcon from '../../icons/CloseIcon.svelte';
	import { fly, fade } from 'svelte/transition';

	export let activePlaylist: Playlist | null = null;
	export let wallpapers: Record<string, WallpaperData> = {};
	export let selectedWallpaperFolder: string | null = null;

	export let onRemove: (index: number) => void;
	export let onSelect: (itemPath: string) => void;
</script>

<div class="panel right-panel">
	<div class="header">
		Wallpapers {activePlaylist ? `(${activePlaylist.items.length})` : ''}
	</div>
	<div class="items-container">
		{#if !activePlaylist}
			<div class="empty-msg">
				Select or create a playlist to manage wallpapers.
			</div>
		{:else if activePlaylist.items.length === 0}
			<div class="empty-msg">
				No wallpapers in this playlist. Click on wallpapers below to
				add them.
			</div>
		{:else}
			<div class="items-scroll">
				{#each activePlaylist.items as itemPath, index (itemPath + index)}
					<div
						class="playlist-item"
						class:selected-item={itemPath.includes(
							selectedWallpaperFolder || ''
						) && selectedWallpaperFolder !== null}
						in:fly={{ y: -20, duration: 200 }}
						out:fade={{ duration: 200 }}
					>
						<div
							class="item-content"
							role="button"
							tabindex="0"
							on:click={() => onSelect(itemPath)}
							on:keydown={(e) =>
								(e.key === 'Enter' || e.key === ' ') &&
								onSelect(itemPath)}
						>
							{#if itemPath}
								{@const idMatch = itemPath.match(
									/431960[\/\\](\d+)[\/\\]/
								)}
								{#if idMatch}
									{@const id = idMatch[1]}
									{@const wpData = wallpapers[id]}
									{#if wpData}
										<img
											src={wpData.previewPath}
											alt="Preview"
											class="preview-img"
										/>
										<div class="title">
											{wpData.projectData
												?.title || id}
										</div>
									{:else}
										<div class="title truncate">
											{itemPath
												.split(/[\/\\]/)
												.pop()}
										</div>
									{/if}
								{:else}
									<div class="title truncate">
										{itemPath
											.split(/[\/\\]/)
											.pop()}
									</div>
								{/if}
							{/if}
						</div>
						<button
							class="remove-btn"
							on:click|stopPropagation={() =>
								onRemove(index)}
							aria-label="Remove from playlist"
						>
							<CloseIcon width="16" height="16" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.header {
		font-weight: 600;
		color: var(--text-color);
		font-size: 1.1em;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 8px;
		margin-bottom: 4px;
	}

	.right-panel {
		flex: 1;
		min-width: 0;

		.items-container {
			flex: 1;
			min-height: 0;
			display: flex;
			align-items: center;
		}

		.empty-msg {
			color: var(--text-muted);
			font-style: italic;
			width: 100%;
			text-align: center;
		}

		.items-scroll {
			display: flex;
			gap: 15px;
			overflow-x: auto;
			overflow-y: hidden;
			padding-top: 10px;
			padding-bottom: 10px;
			width: 100%;

			&::-webkit-scrollbar {
				height: 8px;
			}
			&::-webkit-scrollbar-thumb {
				background: var(--border-color);
				border-radius: 4px;
			}
		}

		.playlist-item {
			position: relative;
			width: 140px;
			height: 140px;
			flex-shrink: 0;
			border-radius: 12px;
			overflow: hidden;
			background: rgba(0, 0, 0, 0.3);
			cursor: pointer;
			transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
			border: 3px solid transparent;

			&:hover {
				border-color: var(--playlist-highlight-border);
				box-shadow: 0 0 15px var(--playlist-highlight);
				transform: translateY(-5px);
			}

			&.selected-item {
				border-color: var(--playlist-highlight-border);
				box-shadow: 0 0 15px var(--playlist-highlight);
			}

			.item-content {
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				position: relative;

				.preview-img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.title {
					position: absolute;
					bottom: -10px;
					left: 50%;
					transform: translateX(-50%);
					width: 90%;
					opacity: 0;
					border-radius: 10px;
					font-weight: 500;
					transition: all 0.2s;
					border: 2px solid var(--playlist-highlight-border);
					padding: 5px;
					text-align: center;
					color: #fff;
					background-color: black;
					font-size: 0.8em;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			&:hover .title {
				opacity: 1;
				bottom: 10px;
			}

			.remove-btn {
				position: absolute;
				top: 4px;
				right: 4px;
				background: rgba(0, 0, 0, 0.6);
				color: white;
				border: none;
				border-radius: 50%;
				width: 24px;
				height: 24px;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				opacity: 0;
				transition: all 0.2s;

				&:hover {
					opacity: 1;
					background: #ff4c4c;
					transform: scale(1.1);
				}
			}

			&:hover .remove-btn {
				opacity: 1;
			}
		}
	}
</style>
