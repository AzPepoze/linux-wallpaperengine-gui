<script lang="ts">
	import { onMount, tick } from 'svelte';

	export let options: { id: string; label?: string; icon?: string; title?: string }[] = [];
	export let selectedId: string;
	export let onChange: (id: string) => void = () => {};

	let container: HTMLElement;
	let indicator: HTMLElement;
	let items: HTMLElement[] = [];

	async function updateIndicator() {
		await tick();
		const index = options.findIndex((opt) => opt.id === selectedId);
		const selectedItem = items[index];

		if (selectedItem && indicator && container) {
			indicator.style.width = `${selectedItem.offsetWidth}px`;
			indicator.style.height = `${selectedItem.offsetHeight}px`;
			indicator.style.left = `${selectedItem.offsetLeft}px`;
			indicator.style.top = `${selectedItem.offsetTop}px`;
			indicator.style.opacity = '1';
		} else if (indicator) {
			indicator.style.opacity = '0';
		}
	}

	$: if (selectedId || options) {
		updateIndicator();
	}

	onMount(() => {
		updateIndicator();
		const resizeObserver = new ResizeObserver(() => updateIndicator());
		resizeObserver.observe(container);
		window.addEventListener('resize', updateIndicator);
		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateIndicator);
		};
	});
</script>

<div class="capsule-container" bind:this={container}>
	<div class="sliding-indicator" bind:this={indicator}></div>
	{#each options as option, i (option.id)}
		<button
			class="capsule-item"
			class:active={selectedId === option.id}
			on:click={() => onChange(option.id)}
			title={option.title || option.label}
			bind:this={items[i]}
		>
			<slot name="item" {option}>
				{#if option.icon}
					<span class="material-icons">{option.icon}</span>
				{/if}
				{#if option.label}
					<span class="label">{option.label}</span>
				{/if}
			</slot>
		</button>
	{/each}
</div>

<style lang="scss">
	.capsule-container {
		display: flex;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		padding: 4px;
		position: relative;
		width: fit-content;
		user-select: none;
	}

	.sliding-indicator {
		position: absolute;
		background: var(--btn-primary-bg);
		border-radius: var(--radius-full);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
		box-shadow: var(--shadow-sm);
	}

	.capsule-item {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 14px;
		border: none;
		background: transparent;
		color: var(--text-color);
		cursor: pointer;
		position: relative;
		z-index: 1;
		font-size: 0.85em;
		font-weight: 500;
		border-radius: var(--radius-full);
		transition: color 0.25s ease;
		white-space: nowrap;

		&:hover:not(.active) {
			color: #fff;
		}

		&.active {
			color: #fff;
		}

		.material-icons {
			font-size: 18px;
		}
	}
</style>
