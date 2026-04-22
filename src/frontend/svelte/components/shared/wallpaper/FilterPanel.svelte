<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		buildFilterCategories,
		type FilterCategory
	} from '@shared/filterConstants';
	import type { FilterConfig } from '@shared/types';
	import { logger } from '@/scripts/shared/logger';
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Collapse from './Collapse.svelte';
	import FilterItem from './FilterItem.svelte';

	export let config: FilterConfig;
	export let onSave: ((config: FilterConfig) => void) | undefined =
		undefined;
	export let onChange: ((config: FilterConfig) => void) | undefined =
		undefined;
	export let onClose: () => void = () => {};

	let localConfig: FilterConfig = JSON.parse(JSON.stringify(config));
	let expandedCategories: Record<string, boolean> = {};
	let filterCategories: FilterCategory[] =
		buildFilterCategories(localConfig);

	// Initialize expanded state
	onMount(() => {
		filterCategories.forEach((cat) => {
			expandedCategories[cat.name] = true;
		});
	});

	function toggleTag(internalKey: keyof FilterConfig, item: string) {
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;
		tags[item] = !tags[item];
		localConfig = { ...localConfig };
		logger.log(
			`Filter toggled: [${internalKey}] ${item} -> ${tags[item]}`
		);
		if (onChange) {
			onChange(localConfig);
		}
	}

	function setGroupState(
		internalKey: keyof FilterConfig,
		items: string[],
		state: boolean
	) {
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;
		items.forEach((item) => (tags[item] = state));
		localConfig = { ...localConfig };
		if (onChange) onChange(localConfig);
	}

	function setCategoryState(category: FilterCategory, state: boolean) {
		const internalKey = category.internalKey as keyof FilterConfig;
		if (!localConfig[internalKey]) {
			(localConfig[internalKey] as any) = {};
		}
		const tags = localConfig[internalKey] as Record<string, boolean>;

		// Set standalone items
		if (category.items) {
			category.items.forEach((item) => (tags[item] = state));
		}

		// Set grouped items
		if (category.groups) {
			category.groups.forEach((group) => {
				group.items.forEach((item) => (tags[item] = state));
			});
		}

		localConfig = { ...localConfig };
		if (onChange) onChange(localConfig);
	}

	function handleSave() {
		if (onSave) {
			onSave(localConfig);
		}
	}

	function handleReset() {
		if (config) {
			localConfig = JSON.parse(JSON.stringify(config));
		}
	}
</script>

<div
	class="filter-panel"
	transition:fly={{ x: -260, duration: 250, opacity: 1 }}
>
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
			<Collapse
				title={category.name}
				bind:isExpanded={expandedCategories[category.name]}
			>
				<svelte:fragment slot="header-actions">
					<Button
						variant="primary"
						style="padding: 2px 6px; font-size: 0.75em;"
						on:click={() => setCategoryState(category, true)}
						>All</Button
					>
					<Button
						variant="primary"
						style="padding: 2px 6px; font-size: 0.75em;"
						on:click={() => setCategoryState(category, false)}
						>None</Button
					>
				</svelte:fragment>

				<div class="filter-grid">
					{#if category.items && category.items.length > 0}
						{#each category.items as item (item)}
							<FilterItem
								label={item}
								isActive={(
									localConfig[
										category.internalKey as keyof FilterConfig
									] as Record<string, boolean>
								)?.[item]}
								onClick={() =>
									toggleTag(
										category.internalKey as keyof FilterConfig,
										item
									)}
							/>
						{/each}
					{/if}

					{#if category.groups}
						{#each category.groups as group (group.name)}
							<div class="filter-group">
								<div class="group-header">
									<h4>{group.name}</h4>
									<div class="group-actions">
										<Button
											variant="primary"
											style="padding: 2px 6px; font-size: 0.75em;"
											on:click={() =>
												setGroupState(
													category.internalKey as keyof FilterConfig,
													group.items,
													true
												)}>All</Button
										>
										<Button
											variant="primary"
											style="padding: 2px 6px; font-size: 0.75em;"
											on:click={() =>
												setGroupState(
													category.internalKey as keyof FilterConfig,
													group.items,
													false
												)}>None</Button
										>
									</div>
								</div>

								<div class="group-items">
									{#each group.items as item (item)}
										<FilterItem
											label={item}
											isActive={(
												localConfig[
													category.internalKey as keyof FilterConfig
												] as Record<
													string,
													boolean
												>
											)?.[item]}
											onClick={() =>
												toggleTag(
													category.internalKey as keyof FilterConfig,
													item
												)}
										/>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</Collapse>
		{/each}
	</div>
</div>

<style lang="scss">
	.filter-panel {
		width: 300px;
		flex-shrink: 0;
		background: var(--bg-surface);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--radius-md);
		margin-right: 20px;
		margin-top: 20px;

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
			}
		}
	}
</style>
