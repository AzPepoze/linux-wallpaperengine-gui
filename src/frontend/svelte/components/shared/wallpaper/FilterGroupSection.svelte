<script lang="ts">
	import type { FilterGroup } from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import Button from '@/components/shared/ui/Button.svelte';
	import FilterItem from './FilterItem.svelte';

	export let group: FilterGroup;
	export let categoryKey: keyof FilterConfig;
	export let categoryConfig: Record<string, boolean>;
	export let onSetGroupState: (internalKey: keyof FilterConfig, items: string[], state: boolean) => void;
	export let onToggleTag: (internalKey: keyof FilterConfig, item: string) => void;
</script>

<div class="filter-group">
	<div class="group-header">
		<h4>{group.name}</h4>
		<div class="group-actions">
			<Button
				variant="primary"
				style="padding: 2px 6px; font-size: 0.75em;"
				on:click={() => onSetGroupState(categoryKey, group.items, true)}
			>
				All
			</Button>
			<Button
				variant="primary"
				style="padding: 2px 6px; font-size: 0.75em;"
				on:click={() => onSetGroupState(categoryKey, group.items, false)}
			>
				None
			</Button>
		</div>
	</div>

	<div class="group-items">
		{#each group.items as item (item)}
			<FilterItem
				label={item}
				isActive={!!categoryConfig[item]}
				onClick={() => onToggleTag(categoryKey, item)}
			/>
		{/each}
	</div>
</div>

<style lang="scss">
	.filter-group {
		display: flex;
		flex-direction: column;
		margin-bottom: 6px;
		padding-bottom: 6px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);

		&:last-child {
			border-bottom: none;
			margin-bottom: 0;
			padding-bottom: 0;
		}

		.group-header {
			display: flex;
			flex-direction: row;
			gap: 4px;
			padding: 4px 6px;
			margin-bottom: 4px;
			justify-content: space-between;
			align-items: center;
			text-wrap: nowrap;

			h4 {
				margin: 0;
				font-size: 0.9em;
				font-weight: 700;
				color: var(--text-color);
			}

			.group-actions {
				display: flex;
				gap: 8px;
			}
		}

		.group-items {
			display: flex;
			flex-direction: column;
			gap: 2px;
			padding-left: 0px;
		}
	}
</style>
