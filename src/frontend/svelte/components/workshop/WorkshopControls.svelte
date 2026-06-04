<script lang="ts">
	import Input from '@/components/shared/ui/Input.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import Select from '@/components/shared/ui/Select.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Toolbar from '@/components/shared/layout/Toolbar.svelte';
	import ViewToggle from '@/components/shared/ui/ViewToggle.svelte';
	import { t } from '@/i18n';

	export let searchText = '';
	export let sortOrder = '0';
	export let itemType = '13';
	export let pageSize = '50';
	export let infiniteScroll = false;
	export let showFilterPanel = false;
	export let searching = false;
	export let totalItems = 0;
	export let viewMode: 'grid' | 'list' = 'grid';

	export let onSearch: () => void;
	export let onToggleFilters: () => void;

	$: sortOptions = [
		{ label: $t('workshop.controls.sortTrend'), value: '13' },
		{ label: $t('workshop.controls.sortRecent'), value: '1' },
		{ label: $t('workshop.controls.sortPopular'), value: '0' },
		{ label: $t('workshop.controls.sortSubscriptions'), value: '12' },
		{ label: $t('workshop.controls.sortVotedUp'), value: '10' },
		{ label: $t('workshop.controls.sortLastUpdated'), value: '19' }
	];

	$: itemTypeOptions = [
		{ label: $t('workshop.controls.typeAll'), value: '13' },
		{ label: $t('workshop.controls.typeItems'), value: '0' },
		{ label: $t('workshop.controls.typeCollections'), value: '3' }
	];

	$: pageSizeOptions = [
		{ label: $t('workshop.controls.page50'), value: '50' },
		{ label: $t('workshop.controls.page100'), value: '100' },
		{ label: $t('workshop.controls.page150'), value: '150' },
		{ label: $t('workshop.controls.page200'), value: '200' }
	];
</script>

<Toolbar>
	<div slot="left" class="left-actions">
		<Button
			variant={showFilterPanel ? 'primary' : 'secondary'}
			on:click={onToggleFilters}
			style="padding: 8px; border-radius: 10px;"
		>
			<Icon name="filter_list" size={20} />
			<span>{$t('workshop.controls.filter')}</span>
		</Button>

		<div class="search-input-wrap">
			<Input
				type="text"
				placeholder={$t('workshop.controls.searchPlaceholder')}
				bind:value={searchText}
				on:keydown={(e) => e.key === 'Enter' && onSearch()}
				style="height: 36px;"
			/>
		</div>

		<Button
			variant="primary"
			on:click={onSearch}
			disabled={searching}
			style="padding: 8px 16px; border-radius: 10px;"
		>
			<Icon name="search" size={20} />
			<span>{$t('workshop.controls.search')}</span>
		</Button>
	</div>

	<div slot="center" class="center-options">
		<div class="option-item">
			<span class="label">{$t('workshop.controls.sort')}</span>
			<Select
				bind:value={sortOrder}
				options={sortOptions}
				onChange={onSearch}
			/>
		</div>
		<div class="option-item">
			<span class="label">{$t('workshop.controls.type')}</span>
			<Select
				bind:value={itemType}
				options={itemTypeOptions}
				onChange={onSearch}
			/>
		</div>
		<div class="option-item">
			<span class="label">{$t('workshop.controls.page')}</span>
			<Select
				bind:value={pageSize}
				options={pageSizeOptions}
				onChange={onSearch}
			/>
		</div>
	</div>

	<div slot="right" class="right-actions">
		<div class="toggle-wrap">
			<Toggle bind:checked={infiniteScroll} />
			<span class="toggle-label">{$t('workshop.controls.infinite')}</span>
		</div>

		{#if totalItems > 0}
			<span class="status-text">{$t('workshop.controls.itemsFound', { count: totalItems.toLocaleString() })}</span>
		{/if}

		<div class="mode-toggle-wrap">
			<ViewToggle bind:viewMode />
		</div>
	</div>
</Toolbar>

<style lang="scss">
	.left-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;

		.search-input-wrap {
			flex: 1;
			max-width: 300px;
		}
	}

	.center-options {
		display: flex;
		align-items: center;
		gap: 20px;

		.option-item {
			display: flex;
			align-items: center;
			gap: 8px;

			.label {
				font-size: 0.75em;
				font-weight: 700;
				color: var(--text-muted);
				white-space: nowrap;
			}
		}
	}

	.right-actions {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
		justify-content: flex-end;

		.status-text {
			font-size: 0.85em;
			color: var(--text-muted);
			font-weight: 500;
			margin-right: 10px;
			white-space: nowrap;
		}

		.mode-toggle-wrap {
			margin-right: 10px;
		}

		.toggle-wrap {
			display: flex;
			align-items: center;
			gap: 8px;

			.toggle-label {
				font-size: 0.85em;
				color: var(--text-muted);
				font-weight: 500;
			}
		}
	}
</style>
