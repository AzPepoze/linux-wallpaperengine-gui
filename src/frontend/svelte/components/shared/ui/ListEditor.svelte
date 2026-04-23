<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import Input from './Input.svelte';
	import Icon from './Icon.svelte';

	export let items: string[] = [];
	export let placeholder: string = 'Add new item...';
	export let label: string = '';

	const dispatch = createEventDispatcher();

	let newItem = '';
	let editingIndex: number | null = null;
	let editingValue = '';

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
		if (editingIndex === index) {
			cancelEdit();
		} else if (editingIndex !== null && editingIndex > index) {
			editingIndex--;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addItem();
		}
	}

	function startEdit(index: number) {
		editingIndex = index;
		editingValue = items[index];
	}

	function saveEdit(index: number) {
		if (editingValue.trim()) {
			items[index] = editingValue.trim();
			items = [...items];
			editingIndex = null;
			dispatch('change', items);
		}
	}

	function cancelEdit() {
		editingIndex = null;
		editingValue = '';
	}

	function handleEditKeydown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter') {
			saveEdit(index);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}
</script>

<div class="list-editor">
	{#if label}
		<span class="list-label">{label}</span>
	{/if}

	<div class="items-list">
		{#each items as item, i}
			<div class="item-row" class:editing={editingIndex === i}>
				{#if editingIndex === i}
					<div class="edit-mode">
						<Input
							bind:value={editingValue}
							on:keydown={(event) =>
								handleEditKeydown(event, i)}
							autofocus
						/>
						<div class="edit-actions">
							<button
								class="action-btn save"
								on:click={() => saveEdit(i)}
								title="Save"
							>
								<Icon name="check" size={16} />
							</button>
							<button
								class="action-btn cancel"
								on:click={cancelEdit}
								title="Cancel"
							>
								<Icon name="close" size={16} />
							</button>
						</div>
					</div>
				{:else}
					<span class="item-text">{item}</span>
					<div class="item-actions">
						<button
							class="action-btn edit"
							on:click={() => startEdit(i)}
							title="Edit"
						>
							<Icon name="edit" size={16} />
						</button>
						<button
							class="action-btn remove"
							on:click={() => removeItem(i)}
							title="Remove"
						>
							<Icon name="delete" size={16} />
						</button>
					</div>
				{/if}
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
		transition: var(--transition-base);

		&.editing {
			padding: 4px;
			background: var(--bg-surface-active);
			border-color: var(--btn-primary-bg);
		}

		.item-text {
			font-size: 0.9em;
			color: var(--text-color);
			flex: 1;
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.item-actions,
		.edit-actions {
			display: flex;
			gap: 4px;
			margin-left: 12px;
		}

		.edit-mode {
			display: flex;
			align-items: center;
			width: 100%;
			gap: 8px;

			:global(.input-wrapper) {
				flex: 1;
			}

			:global(input) {
				padding: 6px 10px;
				font-size: 0.9em;
			}
		}

		.action-btn {
			background: transparent;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			transition: var(--transition-base);

			&:hover {
				background: rgba(255, 255, 255, 0.05);
				color: var(--text-color);
			}

			&.remove:hover {
				color: var(--error-color);
				background: var(--error-bg-translucent);
			}

			&.save:hover {
				color: var(--success-bg);
				background: rgba(40, 167, 69, 0.1);
			}

			&.cancel:hover {
				color: var(--text-muted);
				background: rgba(255, 255, 255, 0.1);
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
