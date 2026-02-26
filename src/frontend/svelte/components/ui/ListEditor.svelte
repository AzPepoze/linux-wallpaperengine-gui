<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	export let items: string[] = [];
	export let placeholder: string = 'Add new item...';
	export let label: string = '';

	const dispatch = createEventDispatcher();

	let newItem = '';

	function addItem() {
		if (newItem.trim()) {
			items = [...items, newItem.trim()];
			newItem = '';
			dispatch('change', items);
		}
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
		dispatch('change', items);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addItem();
		}
	}
</script>

<div class="list-editor">
	{#if label}
		<span class="list-label">{label}</span>
	{/if}

	<div class="items-list">
		{#each items as item, i}
			<div class="item-row">
				<span class="item-text">{item}</span>
				<button
					class="remove-btn"
					on:click={() => removeItem(i)}
					title="Remove"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
		{/each}

		{#if items.length === 0}
			<p class="empty-msg">No items added.</p>
		{/if}
	</div>

	<div class="add-row">
		<Input
			bind:value={newItem}
			{placeholder}
			on:keydown={handleKeydown}
		/>
		<Button
			variant="primary"
			on:click={addItem}
			disabled={!newItem.trim()}
		>
			Add
		</Button>
	</div>
</div>

<style lang="scss">
	.list-editor {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
	}

	.list-label {
		font-size: 0.9em;
		font-weight: 600;
		color: var(--text-muted);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--bg-surface);
		border-radius: var(--radius-md);
		padding: 8px;
		border: 1px solid var(--border-color);
		max-height: 200px;
		overflow-y: auto;
	}

	.item-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: var(--bg-modal);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);

		.item-text {
			font-size: 0.9em;
			word-break: break-all;
			color: var(--text-color);
		}

		.remove-btn {
			background: transparent;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			transition: var(--transition-base);

			&:hover {
				color: var(--error-color);
				background: var(--error-bg-translucent);
			}
		}
	}

	.empty-msg {
		margin: 0;
		padding: 12px;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.85em;
		font-style: italic;
	}

	.add-row {
		display: flex;
		gap: 8px;

		:global(.input-container) {
			flex: 1;
		}
	}
</style>
