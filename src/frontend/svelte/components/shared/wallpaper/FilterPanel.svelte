<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		buildFilterCategories,
		DEFAULT_WORKSHOP_FILTER_CONFIG,
		type FilterCategory
	} from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import { logger } from '@/scripts/shared/logger';
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import ResizeHandle from '@/components/shared/ui/ResizeHandle.svelte';
	import FilterCategorySection from './FilterCategorySection.svelte';
	import { filterPanelWidth } from '@/scripts/shared/ui';

	export let config: FilterConfig;
	export let onSave: ((config: FilterConfig) => void) | undefined = undefined;
	export let onChange: ((config: FilterConfig) => void) | undefined = undefined;
	export let onClose: () => void = () => {};

	let localConfig: FilterConfig = JSON.parse(JSON.stringify(config));
	let expandedCategories: Record<string, boolean> = {};
	let filterCategories: FilterCategory[] = buildFilterCategories(localConfig);
	let isResizing = false;

	onMount(() => {
		filterCategories.forEach((cat) => {
			expandedCategories[cat.name] = true;
		});
	});

	function handleToggleTag(internalKey: keyof FilterConfig, item: string) {
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;
		tags[item] = !tags[item];
		localConfig = { ...localConfig };
		logger.log(`Filter toggled: [${internalKey}] ${item} -> ${tags[item]}`);
		if (onChange) onChange(localConfig);
	}

	function handleSetGroupState(internalKey: keyof FilterConfig, items: string[], state: boolean) {
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;
		items.forEach((item) => (tags[item] = state));
		localConfig = { ...localConfig };
		if (onChange) onChange(localConfig);
	}

	function handleSetCategoryState(category: FilterCategory, state: boolean) {
		const internalKey = category.internalKey as keyof FilterConfig;
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;

		if (category.items) {
			category.items.forEach((item) => (tags[item] = state));
		}

		if (category.groups) {
			category.groups.forEach((group) => {
				group.items.forEach((item) => (tags[item] = state));
			});
		}

		localConfig = { ...localConfig };
		if (onChange) onChange(localConfig);
	}

	function handleSave() {
		if (onSave) onSave(localConfig);
	}

	function handleReset() {
		localConfig = JSON.parse(JSON.stringify(DEFAULT_WORKSHOP_FILTER_CONFIG));
		filterCategories = buildFilterCategories(localConfig);
		if (onChange) onChange(localConfig);
	}
</script>

<div
	class="filter-panel"
	class:resizing={isResizing}
	transition:fly={{ x: -260, duration: 250, opacity: 1 }}
	style="width: {$filterPanelWidth}px;"
>
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

	<div class="panel-inner">
		<div class="panel-header">
			<h3>Filters</h3>
			<div class="header-actions">
				<Button
					variant="secondary"
					on:click={handleReset}
					style="padding: 4px 8px; font-size: 0.8em;"
				>
					<Icon name="restart_alt" size={16} />
					<span>Reset</span>
				</Button>
				{#if onSave}
					<Button
						variant="primary"
						on:click={handleSave}
						style="padding: 4px 12px; font-size: 0.8em;"
					>
						<Icon name="done" size={16} />
						<span>Apply</span>
					</Button>
				{/if}
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
			{#each filterCategories as category (category.name)}
				<FilterCategorySection
					{category}
					{localConfig}
					bind:isExpanded={expandedCategories[category.name]}
					onToggleTag={handleToggleTag}
					onSetGroupState={handleSetGroupState}
					onSetCategoryState={handleSetCategoryState}
				/>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.filter-panel {
		position: relative;
		flex-shrink: 0;
		background: var(--bg-surface);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		overflow: visible;
		border-radius: var(--radius-md);
		margin-right: 15px;
		margin-top: 15px;
		margin-bottom: 15px;
		transition: transform var(--transition-base), opacity var(--transition-base), width var(--transition-base);

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
			width: 100%;
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
