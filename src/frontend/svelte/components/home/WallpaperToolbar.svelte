<script lang="ts">
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Refresh from '@/components/shared/ui/Refresh.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import ViewToggle from '@/components/shared/ui/ViewToggle.svelte';
	import Toolbar from '@/components/shared/layout/Toolbar.svelte';
	import { fly } from 'svelte/transition';
	import { 
		showDisplayManager, 
		showPlaylistManager 
	} from '@/scripts/shared/ui';
	import { cloneMode } from '@/scripts/home/display';
	import type { Wallpaper } from '@shared/types';

	export let activeWallpaper: Wallpaper | null = null;
	export let selectedScreen: string | null = null;
	export let showFilterPanel: boolean = false;
	export let viewMode: 'grid' | 'list' | 'detail' = 'grid';
	export let onRefresh: () => void;
	export let onToggleCloneMode: () => void;
	export let onLoadPlaylists: () => void;
</script>

<Toolbar>
	<div slot="left" class="left-buttons-wrap">
		<Button
			variant={$showPlaylistManager ? 'primary' : 'secondary'}
			on:click={() => {
				showPlaylistManager.update((v) => !v);
				if ($showPlaylistManager) onLoadPlaylists();
			}}
			title="Toggle Playlist Manager"
			style="padding: 8px; border-radius: 10px;"
		>
			<Icon name="featured_play_list" size={20} />
			<span>Playlist</span>
		</Button>

		<Button
			variant={showFilterPanel ? 'primary' : 'secondary'}
			on:click={() => (showFilterPanel = !showFilterPanel)}
			title="Filter Wallpapers"
			style="padding: 8px; border-radius: 10px;"
		>
			<Icon name="filter_list" size={20} />
			<span>Filter</span>
		</Button>
	</div>

	<div slot="center" class="status-info">
		<div class="status-item truncate-item">
			<span class="label">CURRENTLY USING :</span>
			{#if activeWallpaper}
				<div class="value-container">
					{#key activeWallpaper.projectData?.title || activeWallpaper.folderName}
						<span
							in:fly={{ y: 10, duration: 300, delay: 100 }}
							out:fly={{ y: -10, duration: 300 }}
							class="value truncate-text"
							title={activeWallpaper.projectData?.title ||
								activeWallpaper.folderName}
						>
							{activeWallpaper.projectData?.title ||
								activeWallpaper.folderName}
						</span>
					{/key}
				</div>
			{/if}
		</div>
		<div class="status-item">
			<span class="label">DISPLAY :</span>
			{#if selectedScreen || $cloneMode}
				<span
					in:fly={{ y: 20, duration: 300 }}
					out:fly={{ y: -20, duration: 300 }}
					class="value"
				>
					{$cloneMode ? 'ALL' : selectedScreen}
				</span>
			{/if}

			<Button
				variant={$showDisplayManager ? 'primary' : 'secondary'}
				on:click={() => showDisplayManager.update((v) => !v)}
				title="Toggle Display Manager"
				style="padding: 8px; border-radius: 10px;"
			>
				<Icon name="monitor" size={20} />
				<span>Display</span>
			</Button>

			<Button
				variant={$cloneMode ? 'primary' : 'secondary'}
				on:click={onToggleCloneMode}
				title="Clone mode (Apply to all displays)"
				style="padding: 8px; border-radius: 10px;"
			>
				<Icon name="layers" size={20} />
				<span>Clone mode</span>
			</Button>
		</div>
	</div>

	<div slot="right" class="refresh-modes-container">
		<Refresh on:click={onRefresh} />
		<div class="mode-toggles">
			<ViewToggle bind:viewMode />
		</div>
	</div>
</Toolbar>

<style lang="scss">
	.left-buttons-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-info {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 15px 32px;
		font-size: 0.95em;
		white-space: nowrap;

		.status-item {
			display: flex;
			gap: 10px;
			align-items: center;
			flex-shrink: 0;

			&.truncate-item {
				max-width: 400px;
			}

			.label {
				color: var(--text-muted);
				font-weight: 600;
				font-size: 0.85em;
				flex-shrink: 0;
			}

			.value-container {
				display: grid;
				overflow: hidden;
				> span {
					grid-area: 1 / 1;
				}
			}

			.value {
				color: var(--btn-primary-bg);
				font-weight: 700;
				text-transform: uppercase;
			}

			.truncate-text {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				display: inline-block;
				max-width: 100%;
			}
		}
	}

	.refresh-modes-container {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.mode-toggles {
		display: flex;
		gap: 6px;
	}
</style>
