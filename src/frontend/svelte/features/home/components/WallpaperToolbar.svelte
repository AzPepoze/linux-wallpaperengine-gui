<script lang="ts">
	import { t } from '@/core/i18n';
	import { showDisplayManager, showPlaylistManager } from '@/core/ui';
	import {
		cloneMode,
		refreshScreens,
		spanMode,
		toggleCloneMode,
		toggleSpanMode
	} from '@/features/home/scripts/display';
	import { activeFolderName } from '@/features/home/scripts/wallpaperStore';
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';
	import Refresh from '@/ui/Refresh.svelte';
	import Select from '@/ui/Select.svelte';
	import ViewToggle from '@/ui/ViewToggle.svelte';
	import Toolbar from '@/ui/layout/Toolbar.svelte';
	import type { Wallpaper } from '@shared/types';
	import { fly } from 'svelte/transition';

	export let activeWallpaper: Wallpaper | null = null;
	export let selectedScreen: string | null = null;
	export let showFilterPanel: boolean = false;
	export let viewMode: 'grid' | 'list' | 'detail' = 'grid';
	export let sortMethod:
		| 'date-desc'
		| 'date-asc'
		| 'name-asc'
		| 'name-desc' = 'date-desc';
	export let onRefresh: () => void;
	export let onLoadPlaylists: () => void;

	$: displayModeValue = $spanMode
		? 'span'
		: $cloneMode
			? 'clone'
			: 'individual';

	$: displayModeOptions = [
		{
			value: 'individual',
			label: $t('wallpaper.toolbar.individualMode')
		},
		{ value: 'clone', label: $t('wallpaper.toolbar.cloneMode') },
		{ value: 'span', label: $t('wallpaper.toolbar.spanMode') }
	];

	async function handleDisplayModeChange(mode: string) {
		const targetWallpaper =
			activeWallpaper?.folderName || $activeFolderName;
		if (mode === 'clone') {
			if ($spanMode) await toggleSpanMode(false, targetWallpaper);
			if (!$cloneMode) await toggleCloneMode(true, targetWallpaper);
		} else if (mode === 'span') {
			if ($cloneMode) await toggleCloneMode(false, targetWallpaper);
			if (!$spanMode) await toggleSpanMode(true, targetWallpaper);
		} else {
			// individual
			if ($cloneMode) await toggleCloneMode(false, targetWallpaper);
			if ($spanMode) await toggleSpanMode(false, targetWallpaper);
			showDisplayManager.set(true);
		}
		await refreshScreens();
	}
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
			<span>{$t('wallpaper.toolbar.playlist')}</span>
		</Button>

		<Button
			variant={showFilterPanel ? 'primary' : 'secondary'}
			on:click={() => (showFilterPanel = !showFilterPanel)}
			title="Filter Wallpapers"
			style="padding: 8px; border-radius: 10px;"
		>
			<Icon name="filter_list" size={20} />
			<span>{$t('wallpaper.toolbar.filter')}</span>
		</Button>
	</div>

	<div slot="center" class="status-info">
		<div class="status-item truncate-item">
			<span class="label"
				>{$t('wallpaper.toolbar.currentlyUsing')}</span
			>
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
			<span class="label">{$t('wallpaper.toolbar.display')}</span>
			<Select
				id="display-mode-select"
				value={displayModeValue}
				options={displayModeOptions}
				onChange={handleDisplayModeChange}
				style="width: 140px;"
			/>

			<Button
				variant={$showDisplayManager ? 'primary' : 'secondary'}
				on:click={() => showDisplayManager.update((v) => !v)}
				title={selectedScreen
					? `Toggle Display Manager (${selectedScreen})`
					: 'Toggle Display Manager'}
				style="padding: 8px 10px; border-radius: 10px;"
			>
				<Icon name="monitor" size={18} />
				<span>{$t('wallpaper.toolbar.displayBtn')}</span>
			</Button>
		</div>
	</div>

	<div slot="right" class="refresh-modes-container">
		<Select
			id="sort-select"
			bind:value={sortMethod}
			options={[
				{
					value: 'date-desc',
					label: $t('wallpaper.sort.dateDesc')
				},
				{ value: 'date-asc', label: $t('wallpaper.sort.dateAsc') },
				{ value: 'name-asc', label: $t('wallpaper.sort.nameAsc') },
				{ value: 'name-desc', label: $t('wallpaper.sort.nameDesc') }
			]}
			style="width: 160px;"
		/>
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
