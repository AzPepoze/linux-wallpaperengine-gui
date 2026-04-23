<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	export let value: string;
	export let options: { value: string; label: string }[] = [];
	export let id: string = '';
	export let onChange: (value: string) => void = () => {};

	let isOpen = false;
	let container: HTMLDivElement;

	$: selectedLabel =
		options.find((o) => o.value === value)?.label || 'Select option...';

	function toggle() {
		if (options.length === 0) return;
		isOpen = !isOpen;
	}

	function selectOption(optionValue: string) {
		value = optionValue;
		isOpen = false;
		onChange(value);
	}

	function handleClickOutside(event: MouseEvent) {
		if (container && !container.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="select-container" {id} bind:this={container} class:is-open={isOpen}>
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
			class="options-dropdown"
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

	.options-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		width: 100%;
		box-sizing: border-box;
		background: var(--bg-app);
		border: 1px solid var(--border-color-hover);
		border-radius: var(--radius-xl);
		padding: 8px;
		z-index: 1000;
		box-shadow: var(--shadow-lg);
		backdrop-filter: none;
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
