<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Input from './Input.svelte';

	export let items: string[] = [];
	export let placeholder: string = 'Add new path...';
	export let label: string = '';

	const dispatch = createEventDispatcher();

	let newItem = '';
	let editingIndex: number | null = null;
	let editingValue = '';

	function addItem(path?: string) {
		const val = path || newItem;
		if (val.trim()) {
			items = [...items, val.trim()];
			newItem = '';
			dispatch('change', items);
		}
	}

	async function browseAndAdd() {
		const selected = await window.electronAPI.selectDir();
		if (selected) {
			addItem(selected);
		}
	}

	async function browseAndEdit(_index: number) {
		const selected = await window.electronAPI.selectDir();
		if (selected) {
			editingValue = selected;
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

<div class="path-list-editor">
	{#if label}
		<span class="list-label">{label}</span>
	{/if}

	<div class="items-list">
		{#each items as item, i}
			<div class="item-row" class:editing={editingIndex === i}>
				{#if editingIndex === i}
					<div class="edit-mode">
						<div class="input-with-browse">
							<Input
								bind:value={editingValue}
								on:keydown={(event) =>
									handleEditKeydown(event, i)}
								autofocus
							/>
							<button
								class="browse-inline-btn"
								on:click={() => browseAndEdit(i)}
								title="Browse directory"
							>
								<Icon name="folder_open" size={16} />
							</button>
						</div>
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
					<div class="path-info">
						<Icon
							name="folder"
							size={18}
							style="color: var(--btn-primary-bg); opacity: 0.7;"
						/>
						<span class="item-text" title={item}>{item}</span>
					</div>
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
			<div class="empty-state">
				<Icon
					name="search_off"
					size={32}
					style="opacity: 0.3; margin-bottom: 8px;"
				/>
				<p class="empty-msg">No search paths added.</p>
			</div>
		{/if}
	</div>

	<div class="add-row">
		<div class="input-with-browse">
			<Input
				bind:value={newItem}
				{placeholder}
				on:keydown={handleKeydown}
			/>
			<button
				class="browse-inline-btn"
				on:click={browseAndAdd}
				title="Browse directory"
			>
				<Icon name="folder_open" size={18} />
				<span>Browse</span>
			</button>
		</div>
		<Button
			variant="primary"
			on:click={() => addItem()}
			disabled={!newItem.trim()}
			style="padding: 0 20px;"
		>
			Add
		</Button>
	</div>
</div>

<style lang="scss">
	.path-list-editor {
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
		gap: 10px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-lg);
		padding: 12px;
		border: 1px solid var(--border-color);
		min-height: 100px;
		max-height: 400px;
		overflow-y: auto;
	}

	.item-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: var(--bg-surface);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		transition: var(--transition-base);

		&:hover {
			background: var(--bg-surface-hover);
			border-color: var(--border-color-hover);
		}

		&.editing {
			padding: 8px;
			background: var(--bg-surface-active);
			border-color: var(--btn-primary-bg);
		}

		.path-info {
			display: flex;
			align-items: center;
			gap: 12px;
			flex: 1;
			min-width: 0;
		}

		.item-text {
			font-size: 0.9em;
			color: var(--text-color);
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-family: monospace;
			opacity: 0.9;
		}

		.item-actions,
		.edit-actions {
			display: flex;
			gap: 6px;
			margin-left: 12px;
		}

		.edit-mode {
			display: flex;
			align-items: center;
			width: 100%;
			gap: 10px;
		}

		.input-with-browse {
			display: flex;
			flex: 1;
			background: transparent;
			overflow: hidden;
			transition: var(--transition-base);

			:global(.input-wrapper) {
				flex: 1;
			}

			:global(input) {
				padding: 10px 14px;
				font-size: 0.9em;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
		}

		.browse-inline-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 0 12px;
			background: var(--bg-surface-hover);
			border: 1px solid var(--border-color);
			border-left: none;
			color: var(--text-color);
			cursor: pointer;
			font-size: 0.8em;
			font-weight: 600;
			transition: var(--transition-base);
			border-top-right-radius: var(--radius-lg);
			border-bottom-right-radius: var(--radius-lg);

			&:hover {
				background: var(--btn-primary-bg);
				color: #fff;
				border-color: var(--btn-primary-bg);
			}
		}

		.action-btn {
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid var(--border-color);
			color: var(--text-muted);
			cursor: pointer;
			padding: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--radius-md);
			transition: var(--transition-base);

			&:hover {
				background: rgba(255, 255, 255, 0.1);
				border-color: var(--border-color-hover);
				color: var(--text-color);
			}

			&.remove:hover {
				color: #fff;
				background: var(--error-bg);
				border-color: var(--error-border);
			}

			&.save:hover {
				color: #fff;
				background: var(--success-bg);
				border-color: var(--success-border);
			}
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 30px;
		color: var(--text-muted);
	}

	.empty-msg {
		margin: 0;
		font-size: 0.9em;
		font-style: italic;
	}

	.add-row {
		display: flex;
		gap: 10px;
		align-items: stretch;

		.input-with-browse {
			display: flex;
			flex: 1;
			background: transparent;
			overflow: hidden;
			transition: var(--transition-base);

			:global(.input-wrapper) {
				flex: 1;
			}

			:global(input) {
				padding: 12px 16px;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
		}

		.browse-inline-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 0 16px;
			background: var(--bg-surface-hover);
			border: 1px solid var(--border-color);
			border-left: none;
			color: var(--text-color);
			cursor: pointer;
			font-size: 0.85em;
			font-weight: 600;
			transition: var(--transition-base);
			border-top-right-radius: var(--radius-lg);
			border-bottom-right-radius: var(--radius-lg);

			&:hover {
				background: var(--btn-primary-bg);
				color: #fff;
				border-color: var(--btn-primary-bg);
			}
		}
	}
</style>
