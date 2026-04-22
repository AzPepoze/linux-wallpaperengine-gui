<script lang="ts">
	import type { FilterCategory } from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import Button from '@/components/shared/ui/Button.svelte';
	import Collapse from './Collapse.svelte';
	import FilterItem from './FilterItem.svelte';
	import FilterGroupSection from './FilterGroupSection.svelte';

	export let category: FilterCategory;
	export let localConfig: FilterConfig;
	export let isExpanded: boolean;
	export let onToggleTag: (internalKey: keyof FilterConfig, item: string) => void;
	export let onSetGroupState: (internalKey: keyof FilterConfig, items: string[], state: boolean) => void;
	export let onSetCategoryState: (category: FilterCategory, state: boolean) => void;

	$: categoryKey = category.internalKey as keyof FilterConfig;
	$: categoryConfig = localConfig[categoryKey] as Record<string, boolean> || {};

	function getIsActive(item: string) {
		return !!categoryConfig[item];
	}
</script>

<Collapse title={category.name} bind:isExpanded>
	<svelte:fragment slot="header-actions">
		<Button
			variant="primary"
			style="padding: 2px 6px; font-size: 0.75em;"
			on:click={() => onSetCategoryState(category, true)}
		>
			All
		</Button>
		<Button
			variant="primary"
			style="padding: 2px 6px; font-size: 0.75em;"
			on:click={() => onSetCategoryState(category, false)}
		>
			None
		</Button>
	</svelte:fragment>

	<div class="filter-grid">
		{#if category.items && category.items.length > 0}
			{#each category.items as item (item)}
				<FilterItem
					label={item}
					isActive={getIsActive(item)}
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
