<script lang="ts">
	import { fly } from 'svelte/transition';
	import { FILTER_CATEGORIES, type FilterCategory } from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import { logger } from '@/core/logger';
	import Button from '@/ui/Button.svelte';
	import { t } from '@/core/i18n';
	import Icon from '@/ui/Icon.svelte';
	import ResizeHandle from '@/ui/ResizeHandle.svelte';
	import FilterCategorySection from './FilterCategorySection.svelte';
	import { filterPanelWidth } from '@/core/ui';
	import {
		getCategoryItems,
		setTags,
		toggleTag
	} from '@/core/utils/filterConfig';

	// The page owns the config; the panel only shows it and reports changes.
	export let config: FilterConfig;
	export let defaults: FilterConfig;
	export let show: boolean = true;
	export let hiddenCategories: string[] = [];
	export let onChange: (config: FilterConfig) => void;
	export let onClose: () => void = () => {};

	let expandedCategories: Record<string, boolean> = Object.fromEntries(
		FILTER_CATEGORIES.map((category) => [category.name, true])
	);
	let isResizing = false;

	$: visibleCategories = FILTER_CATEGORIES.filter(
		(category) => !hiddenCategories.includes(category.name)
	);

	function handleToggleTag(internalKey: keyof FilterConfig, item: string) {
		const next = toggleTag(config, internalKey, item);
		logger.log(`Filter toggled: [${internalKey}] ${item}`);
		onChange(next);
	}

	function handleSetGroupState(
		internalKey: keyof FilterConfig,
		items: string[],
		state: boolean
	) {
		onChange(setTags(config, internalKey, items, state));
	}

	function handleSetCategoryState(category: FilterCategory, state: boolean) {
		const internalKey = category.internalKey as keyof FilterConfig;
		const items = getCategoryItems(category);
		onChange(setTags(config, internalKey, items, state));
	}

	function handleReset() {
		onChange(defaults);
	}
</script>

<div
	class="filter-panel"
	class:open={show}
	class:resizing={isResizing}
	style="--panel-width: {$filterPanelWidth}px;"
>
	{#if show}
		<ResizeHandle
			bind:isResizing
			position="right"
			minWidth={200}
			maxWidth={600}
			width={$filterPanelWidth}
			onResize={(w) => filterPanelWidth.set(w)}
			calculateWidth={(clientX) => {
				const panel = document.querySelector('.filter-panel');
				if (panel) {
					const rect = panel.getBoundingClientRect();
					return clientX - rect.left;
				}
				return clientX;
			}}
		/>

		<div class="panel-inner" transition:fly={{ x: -20, duration: 400, opacity: 0 }}>
			<div class="panel-header">
				<h3>{$t('filter.ui.filters')}</h3>
				<div class="header-actions">
					<Button
						variant="secondary"
						on:click={handleReset}
						style="padding: 4px 8px; font-size: 0.8em;"
					>
						<Icon name="restart_alt" size={16} />
						<span>{$t('filter.ui.reset')}</span>
					</Button>
					<Button
						variant="primary"
						on:click={onClose}
						style="padding: 4px 12px; font-size: 0.8em;"
					>
						<Icon name="done" size={16} />
						<span>{$t('filter.ui.apply')}</span>
					</Button>
					<Button
						variant="secondary"
						on:click={onClose}
						style="padding: 4px; display: flex; align-items: center; justify-content: center;"
					>
						<Icon name="close" size={16} />
					</Button>
				</div>
			</div>

			<div class="panel-content">
				{#each visibleCategories as category (category.name)}
					<FilterCategorySection
						{category}
						{config}
						bind:isExpanded={expandedCategories[category.name]}
						onToggleTag={handleToggleTag}
						onSetGroupState={handleSetGroupState}
						onSetCategoryState={handleSetCategoryState}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.filter-panel {
		position: relative;
		flex-shrink: 0;
		background: var(--bg-surface);
		border-right: 0px solid transparent;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--radius-md);
		margin-top: 15px;
		margin-bottom: 15px;
		
		width: 0;
		min-width: 0;
		opacity: 0;
		margin-right: 0;
		
		transition: 
			width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
			margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1),
			border-right 0.35s cubic-bezier(0.4, 0, 0.2, 1);

		&.open {
			width: var(--panel-width);
			opacity: 1;
			margin-right: 15px;
			border-right: 1px solid var(--border-color);
		}

		&.resizing {
			transition: none;
		}

		.panel-inner {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			border-radius: inherit;
			height: 100%;
			width: var(--panel-width);
		}

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
		}
	}
</style>
