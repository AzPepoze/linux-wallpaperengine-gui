<script lang="ts">
	import { t } from '@/core/i18n';
	import { showDisplayManager, showPlaylistManager } from '@/core/ui';
	import SidebarToggle from '@/ui/SidebarToggle.svelte';
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';
	import Refresh from '@/ui/Refresh.svelte';
	import Select from '@/ui/Select.svelte';
	import ViewToggle from '@/ui/ViewToggle.svelte';
	import Toolbar from '@/ui/layout/Toolbar.svelte';
	import StatusSearch from './StatusSearch.svelte';
	import type { Wallpaper } from '@shared/types';

	export let activeWallpaper: Wallpaper | null = null;
	export let selectedScreen: string | null = null;
	export let showFilterPanel: boolean = false;
	export let viewMode: 'grid' | 'list' | 'detail' = 'grid';
	export let sortMethod:
		| 'date-desc'
		| 'date-asc'
		| 'name-asc'
		| 'name-desc' = 'date-desc';
	export let searchQuery: string = '';
	export let onRefresh: () => void;
	export let onLoadPlaylists: () => void;
</script>

<Toolbar fillLeft>
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

		<StatusSearch {activeWallpaper} bind:searchQuery />

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

		<SidebarToggle />
	</div>
</Toolbar>

<style lang="scss">
	.left-buttons-wrap {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		flex-grow: 1;
		min-width: 0;
		gap: 8px;

		:global(.select-trigger) {
			padding: 8px 12px;
			height: 36px;
			box-sizing: border-box;
		}
	}

	:global(.refresh .btn) {
		height: 36px;
		box-sizing: border-box;
	}

	@media (max-width: 900px) {
		:global(.toolbar) {
			flex-wrap: wrap;
		}

		.refresh-modes-container {
			width: 100%;
			justify-content: flex-end;
		}
	}

	@media (max-width: 600px) {
		.left-buttons-wrap {
			flex-wrap: wrap;
		}
	}

	.refresh-modes-container {
		display: flex;
		align-items: center;
		gap: 8px;

		:global(.select-trigger) {
			padding: 8px 12px;
			height: 36px;
			box-sizing: border-box;
		}

		:global(.btn) {
			height: 36px;
			box-sizing: border-box;
		}
	}

	.mode-toggles {
		display: flex;
		gap: 6px;

		:global(.sliding-capsule) {
			height: 36px;
			box-sizing: border-box;
		}
	}
</style>
