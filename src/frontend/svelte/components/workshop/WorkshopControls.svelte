<script lang="ts">
	import Input from '@/components/shared/ui/Input.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import Select from '@/components/shared/ui/Select.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Toolbar from '@/components/shared/layout/Toolbar.svelte';
	import ViewToggle from '@/components/shared/ui/ViewToggle.svelte';

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

	const sortOptions = [
		{ label: 'Trend', value: '13' },
		{ label: 'Recent', value: '1' },
		{ label: 'Popular', value: '0' },
		{ label: 'Subscriptions', value: '12' },
		{ label: 'Voted Up', value: '10' },
		{ label: 'Last Updated', value: '19' }
	];

	const itemTypeOptions = [
		{ label: 'All', value: '13' },
		{ label: 'Items', value: '0' },
		{ label: 'Collections', value: '3' }
	];

	const pageSizeOptions = [
		{ label: '50 items', value: '50' },
		{ label: '100 items', value: '100' },
		{ label: '150 items', value: '150' },
		{ label: '200 items', value: '200' }
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
			<span>Filter</span>
		</Button>

		<div class="search-input-wrap">
			<Input
				type="text"
				placeholder="Search wallpapers..."
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
			<span>Search</span>
		</Button>
	</div>

	<div slot="center" class="center-options">
		<div class="option-item">
			<span class="label">SORT :</span>
			<Select
				bind:value={sortOrder}
				options={sortOptions}
				onChange={onSearch}
			/>
		</div>
		<div class="option-item">
			<span class="label">TYPE :</span>
			<Select
				bind:value={itemType}
				options={itemTypeOptions}
				onChange={onSearch}
			/>
		</div>
		<div class="option-item">
			<span class="label">PAGE :</span>
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
			<span class="toggle-label">Infinite</span>
		</div>

		{#if totalItems > 0}
			<span class="status-text">{totalItems.toLocaleString()} items found</span>
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
