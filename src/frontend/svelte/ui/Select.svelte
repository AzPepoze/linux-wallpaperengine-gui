<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { portal } from '@/core/utils/portal';

	export let value: string;
	export let options: { value: string; label: string }[] = [];
	export let id: string = '';
	export let style: string = '';
	export let onChange: (value: string) => void = () => {};

	let isOpen = false;
	let container: HTMLDivElement;
	let dropdownContainer: HTMLDivElement;
	let dropdownRect = { top: 0, left: 0, width: 0, centerX: 0 };

	$: selectedLabel =
		options.find((o) => o.value === value)?.label || 'Select option...';

	function updateRect() {
		if (!container) return;
		const rect = container.getBoundingClientRect();
		dropdownRect = {
			top: rect.bottom + 8,
			left: rect.left,
			width: rect.width,
			centerX: rect.left + rect.width / 2
		};
	}

	function toggle() {
		if (options.length === 0) return;
		isOpen = !isOpen;
		if (isOpen) {
			updateRect();
		}
	}

	function selectOption(optionValue: string) {
		value = optionValue;
		isOpen = false;
		onChange(value);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		const clickedOutsideContainer = container && !container.contains(target);
		const clickedOutsideDropdown = !dropdownContainer || !dropdownContainer.contains(target);
		
		if (clickedOutsideContainer && clickedOutsideDropdown) {
			isOpen = false;
		}
	}

	function handleCloseEvent(event: Event) {
		if (!isOpen) return;
		if (event.type === 'scroll' && dropdownContainer && dropdownContainer.contains(event.target as Node)) {
			return;
		}
		isOpen = false;
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);
		window.addEventListener('scroll', handleCloseEvent, true);
		window.addEventListener('resize', handleCloseEvent);
		return () => {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('scroll', handleCloseEvent, true);
			window.removeEventListener('resize', handleCloseEvent);
		};
	});
</script>

<div class="select-container" {id} {style} bind:this={container} class:is-open={isOpen}>
	<button
		class="select-trigger"
		class:active={isOpen}
		on:click={toggle}
		type="button"
	>
		<span class="label">{selectedLabel}</span>
		<div class="chevron" class:rotated={isOpen} class:hidden={options.length === 0}>
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</div>
	</button>

	{#if isOpen}
		<div
			use:portal
			bind:this={dropdownContainer}
			class="dropdown-wrapper"
			style="top: {dropdownRect.top}px; left: {dropdownRect.centerX}px; transform: translateX(-50%);"
		>
			<div
				class="options-dropdown"
				style="min-width: {dropdownRect.width}px; width: max-content;"
				in:fly={{ y: -10, duration: 200 }}
				out:fade={{ duration: 150 }}
			>
				{#each options as option}
				<button
					class="option-item"
					class:selected={option.value === value}
					on:click={() => selectOption(option.value)}
					type="button"
				>
					{option.label}
					{#if option.value === value}
						<div class="check" in:fade>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="20 6 9 17 4 12"
								></polyline>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.select-container {
		width: 100%;
		position: relative;
		user-select: none;

		&.is-open {
			z-index: 100;
		}
	}

	.select-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		background-color: var(--bg-surface);
		color: var(--text-color);
		font-size: 0.95em;
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-base);
		text-align: left;

		&:hover {
			background-color: var(--bg-surface-hover);
			border-color: var(--border-color-hover);
			transform: translateY(-1px);
		}

		&.active {
			border-color: var(--btn-primary-bg);
			background-color: var(--bg-surface-active);
			box-shadow: 0 0 0 4px var(--focus-ring-light);
		}

		.label {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.chevron {
		margin-left: 12px;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		transition: var(--transition-slow);

		&.rotated {
			transform: rotate(180deg);
			color: var(--btn-primary-bg);
		}

		&.hidden {
			visibility: hidden;
		}
	}

	.dropdown-wrapper {
		position: fixed;
		z-index: 1000;
	}

	.options-dropdown {
		box-sizing: border-box;
		background: var(--bg-app);
		border: 1px solid var(--border-color-hover);
		border-radius: var(--radius-xl);
		padding: 8px;
		z-index: 1000;
		box-shadow: var(--shadow-lg);
		backdrop-filter: none;
		max-height: 300px;
		overflow-y: auto;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
			margin: 8px 0;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.1);
			border-radius: 10px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.option-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		border: none;
		background: transparent;
		color: var(--text-color);
		opacity: 0.9;
		font-size: 0.9em;
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: var(--transition-base);
		text-align: left;
		box-sizing: border-box;
		white-space: nowrap;
		gap: 12px;

		&:hover {
			background: var(--bg-surface-hover);
			opacity: 1;
			transform: translateX(4px);
		}

		&.selected {
			background: var(--bg-surface-active);
			color: var(--btn-primary-bg);
			opacity: 1;
			font-weight: 700;
			box-shadow: inset 0 0 0 1px var(--bg-primary-translucent);
		}

		.check {
			display: flex;
			align-items: center;
			color: var(--btn-primary-bg);
		}
	}
</style>
