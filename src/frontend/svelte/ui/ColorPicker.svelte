<script lang="ts">
	import { hexToRgbFloat, rgbFloatToHex } from '@/core/utils/colorHelper';

	export let value: string = '1 1 1';
	export let id: string = '';
	export let palette: [number, number, number][] = [];
	export let onInput: (val: string) => void = () => {};

	const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
	const floatPattern = /^\s*\d*\.?\d+(\s+\d*\.?\d+){2}\s*$/;

	$: hexValue = rgbFloatToHex(value);

	// Text the user is typing; reset whenever the color changes from elsewhere
	let draft = '';
	$: draft = hexValue;

	function commit(next: string) {
		value = next;
		onInput(value);
	}

	function handleSwatchChange(e: Event) {
		const target = e.target as HTMLInputElement;
		commit(hexToRgbFloat(target.value));
	}

	function commitDraft() {
		const text = draft.trim();
		if (hexPattern.test(text)) {
			commit(hexToRgbFloat(text.startsWith('#') ? text : `#${text}`));
		} else if (floatPattern.test(text)) {
			commit(text);
		} else {
			draft = hexValue;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.currentTarget as HTMLInputElement).blur();
		}
	}

	function selectFromPalette(color: [number, number, number]) {
		const rgbFloat = `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)}`;
		commit(rgbFloat);
	}
</script>

<div class="color-picker-container">
	<div class="color-field">
		<span class="swatch" style="background-color: {hexValue}">
			<input
				type="color"
				{id}
				value={hexValue}
				on:change={handleSwatchChange}
				aria-label="Pick color"
			/>
		</span>
		<input
			type="text"
			class="hex-input"
			bind:value={draft}
			on:blur={commitDraft}
			on:keydown={handleKeydown}
			spellcheck="false"
			autocomplete="off"
		/>
	</div>

	{#if palette.length > 0}
		<div class="palette-container custom-scrollbar">
			{#each palette as color}
				<button
					class="palette-item"
					style="background-color: rgb({color.join(',')})"
					on:click={() => selectFromPalette(color)}
					title="rgb({color.join(',')})"
					type="button"
				></button>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.color-picker-container {
		container-type: inline-size;
		container-name: colorpicker;
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		min-width: 200px;
		color: var(--text-color);
	}

	.color-field {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 12px 4px 4px;
		background: var(--bg-surface-active);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: text;
		transition: var(--transition-base);

		&:hover {
			border-color: var(--border-color-hover);
		}

		&:focus-within {
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 0 3px var(--focus-ring);
		}
	}

	.swatch {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		overflow: hidden;

		input {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			opacity: 0;
			cursor: pointer;
		}
	}

	.hex-input {
		flex: 1;
		min-width: 0;
		padding: 6px 0;
		background: transparent;
		border: none;
		color: var(--text-color);
		font-family: monospace;
		font-size: 0.9em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		outline: none;
	}

	.palette-container {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px;
		background: var(--bg-surface-active);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		max-height: 120px;
		overflow-y: auto;
	}

	/* CSS Container Query to hide palette when width is too small */
	@container colorpicker (width < 160px) {
		.palette-container {
			display: none;
		}
	}

	.palette-item {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: 1.5px solid var(--border-color);
		cursor: pointer;
		transition: var(--transition-base);
		padding: 0;
		box-shadow: var(--shadow-sm);

		&:hover {
			transform: translateY(-2px);
			border-color: var(--text-color);
			box-shadow: var(--shadow-md);
			z-index: 1;
		}

		&:active {
			transform: translateY(0);
		}
	}
</style>
