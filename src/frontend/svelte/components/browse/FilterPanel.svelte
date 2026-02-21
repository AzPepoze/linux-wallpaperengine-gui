<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { FilterConfig } from '../../../shared/types';
	import { filterCategories, mapCategoryToInternal } from '../../../shared/filterConstants';
	import FilterItem from './FilterItem.svelte';
	import Collapse from './Collapse.svelte';
	import Button from '../ui/Button.svelte';
	import { logger } from '../../scripts/logger';

	export let config: FilterConfig;
	export let onSave: ((config: FilterConfig) => void) | undefined = undefined;
	export let onChange: ((config: FilterConfig) => void) | undefined = undefined;
	export let onClose: () => void = () => {};

	let localConfig: FilterConfig = JSON.parse(JSON.stringify(config));
	let expandedCategories: Record<string, boolean> = {};

	// Initialize expanded state
	onMount(() => {
		filterCategories.forEach(cat => {
			expandedCategories[cat.name] = true;
		});
	});

	function toggleTag(category: string, item: string) {
		const internalKey = mapCategoryToInternal(category) as keyof FilterConfig;
		const tags = localConfig[internalKey] as Record<string, boolean>;
		tags[item] = !tags[item];
		localConfig = { ...localConfig };
		logger.log(`Filter toggled: [${category}] ${item} -> ${tags[item]}`);
		if (onChange) {
			onChange(localConfig);
		}
	}

	function handleSave() {
		logger.log('FilterPanel: Apply clicked');
		if (onSave) {
			onSave(localConfig);
		}
	}

	function handleReset() {
		logger.log('FilterPanel: Reset clicked');
		localConfig = JSON.parse(JSON.stringify(config));
	}
</script>

<div class="filter-panel" transition:fly={{ x: -260, duration: 250, opacity: 1 }}>
	<div class="panel-header">
		<h3>Filters</h3>
		<div class="header-actions">
			<Button variant="secondary" on:click={handleReset} style="padding: 4px 8px; font-size: 0.8em;">Reset</Button>
			{#if onSave}
				<Button variant="primary" on:click={handleSave} style="padding: 4px 12px; font-size: 0.8em;">Apply</Button>
			{/if}
			<Button variant="secondary" on:click={onClose} style="padding: 4px; display: flex; align-items: center; justify-content: center;">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</Button>
		</div>
	</div>

	<div class="panel-content">
		{#each filterCategories as category (category.name)}
			<Collapse title={category.name} bind:isExpanded={expandedCategories[category.name]}>
				<div class="filter-grid">
					{#each category.items as item (item)}
						<FilterItem
							label={item}
							isActive={(localConfig[mapCategoryToInternal(category.name) as keyof FilterConfig] as Record<string, boolean>)?.[item]}
							onClick={() => toggleTag(category.name, item)}
						/>
					{/each}
				</div>
			</Collapse>
		{/each}
	</div>
</div>

<style lang="scss">
	.filter-panel {
		width: 260px;
		flex-shrink: 0;
		background: var(--bg-surface);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.panel-header {
			padding: 12px 15px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: rgba(255, 255, 255, 0.03);
			border-bottom: 1px solid var(--border-color);
			flex-shrink: 0;

			h3 {
				margin: 0;
				font-size: 0.95rem;
				font-weight: 600;
				color: var(--text-color);
			}

			.header-actions {
				display: flex;
				gap: 6px;
				align-items: center;
			}
		}

		.panel-content {
			padding: 12px;
			overflow-y: auto;
			flex: 1;

			:global(.collapse-container) {
				margin-bottom: 12px;
				border-bottom: 1px solid rgba(255, 255, 255, 0.05);
				padding-bottom: 8px;

				&:last-child {
					border-bottom: none;
				}
			}

			.filter-grid {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		}
	}
</style>
