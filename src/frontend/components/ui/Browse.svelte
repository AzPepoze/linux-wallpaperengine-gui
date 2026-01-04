<script lang="ts">
	let { location = $bindable(), onSelect, dir = false, placeholder = "" } = $props();

	async function select() {
		const selected = dir 
			? await window.electronAPI.selectDir() 
			: await window.electronAPI.selectFile();
		
		if (selected) {
			location = selected;
			if (onSelect) onSelect(selected);
		}
	}

	function handleBlur() {
		if (location && onSelect) {
			onSelect(location);
		}
	}
</script>

<div class="browse">
	<input
		type="text"
		class="path-input"
		bind:value={location}
		onblur={handleBlur}
		{placeholder}
	/>
	<button class="select-btn" onclick={select}> Browse </button>
</div>

<style lang="scss">
	.browse {
		display: flex;
		width: 100%;
		gap: 10px;
		align-items: center;
		min-width: 0;
	}

	.path-input {
		flex: 1;
		min-width: 0;
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background-color: rgba(255, 255, 255, 0.1);
		color: #fff;
		font-family: inherit;
		font-size: 0.9em;
		transition: all 0.2s;
		text-overflow: ellipsis;

		&:hover {
			filter: brightness(1.2);
		}

		&:focus {
			outline: none;
			border-color: var(--btn-primary-bg, #007bff);
			background-color: rgba(255, 255, 255, 0.15);
		}
	}

	.select-btn {
		padding: 8px 16px;
		border-radius: 6px;
		background-color: var(--btn-primary-bg, #007bff);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.2s;
		white-space: nowrap;

		&:hover {
			filter: brightness(1.2);
			border-color: rgba(255, 255, 255, 0.3);
		}
	}
</style>
