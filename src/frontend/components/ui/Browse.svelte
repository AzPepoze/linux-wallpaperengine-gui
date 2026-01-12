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

<div class="browse-container">
	<div class="input-group">
		<input
			type="text"
			class="path-input"
			bind:value={location}
			onblur={handleBlur}
			{placeholder}
		/>
		<button class="browse-btn" onclick={select}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
			</svg>
			<span>Browse</span>
		</button>
	</div>
</div>

<style lang="scss">
	.browse-container {
		width: 100%;
		display: flex;
		min-width: 0;
	}

	.input-group {
		display: flex;
		width: 100%;
		background-color: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			border-color: rgba(255, 255, 255, 0.15);
			background-color: rgba(255, 255, 255, 0.05);
		}

		&:focus-within {
			border-color: var(--btn-primary-bg, #007bff);
			box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
			background-color: rgba(255, 255, 255, 0.08);
		}
	}

	.path-input {
		flex: 1;
		min-width: 0;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: #fff;
		font-family: inherit;
		font-size: 0.9em;
		text-overflow: ellipsis;

		&:focus {
			outline: none;
		}

		&::placeholder {
			color: rgba(255, 255, 255, 0.25);
		}
	}

	.browse-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 20px;
		background-color: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.9);
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		cursor: pointer;
		font-size: 0.85em;
		font-weight: 600;
		transition: all 0.2s;
		white-space: nowrap;

		&:hover {
			background-color: var(--btn-primary-bg, #007bff);
			color: #fff;
		}

		&:active {
			filter: brightness(0.9);
		}

		svg {
			opacity: 0.7;
		}
	}
</style>
