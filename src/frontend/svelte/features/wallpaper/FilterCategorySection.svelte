<script lang="ts">
	import type { FilterCategory } from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import { t } from '@/core/i18n';
	import Button from '@/ui/Button.svelte';
	import Collapse from './Collapse.svelte';
	import FilterItem from './FilterItem.svelte';
	import FilterGroupSection from './FilterGroupSection.svelte';

	export let category: FilterCategory;
	export let localConfig: FilterConfig;
	export let isExpanded: boolean;
	export let onToggleTag: (
		internalKey: keyof FilterConfig,
		item: string
	) => void;
	export let onSetGroupState: (
		internalKey: keyof FilterConfig,
		items: string[],
		state: boolean
	) => void;
	export let onSetCategoryState: (
		category: FilterCategory,
		state: boolean
	) => void;

	const ITEM_NS: Record<string, string> = {
		typetags: 'filter.type',
		tags: 'filter.genre',
		ratingtags: 'filter.items',
		categorytags: 'filter.items',
		sourcetags: 'filter.items',
		resolutiontags: 'filter.items'
	};

	$: categoryKey = category.internalKey as keyof FilterConfig;
	$: categoryConfig =
		(localConfig[categoryKey] as Record<string, boolean>) || {};

	function itemLabel(item: string): string {
		const ns = ITEM_NS[categoryKey];
		if (!ns) return item;
		const key = ns + '.' + item;
		const result = $t(key);
		return result === key ? item : result;
	}
</script>

<Collapse title={$t('filter.categories.' + category.internalKey)} bind:isExpanded>
	<svelte:fragment slot="header-actions">
		<Button
			variant="primary"
			style="padding: 2px 6px; font-size: 0.75em;"
			on:click={() => onSetCategoryState(category, true)}
		>
			{$t('filter.ui.all')}
		</Button>
		<Button
			variant="primary"
			style="padding: 2px 6px; font-size: 0.75em;"
			on:click={() => onSetCategoryState(category, false)}
		>
			{$t('filter.ui.none')}
		</Button>
	</svelte:fragment>

	<div class="filter-grid">
		{#if category.items && category.items.length > 0}
			{#each category.items as item (item)}
				<FilterItem
					label={itemLabel(item)}
					isActive={!!categoryConfig[item]}
					onClick={() => onToggleTag(categoryKey, item)}
				/>
			{/each}
		{/if}

		{#if category.groups}
			{#each category.groups as group (group.name)}
				<FilterGroupSection
					{group}
					{categoryKey}
					{categoryConfig}
					{onSetGroupState}
					{onToggleTag}
				/>
			{/each}
		{/if}
	</div>
</Collapse>

<style lang="scss">
	.filter-grid {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
</style>
