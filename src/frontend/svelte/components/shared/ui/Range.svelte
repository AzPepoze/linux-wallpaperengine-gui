<script lang="ts">
	export let value: number;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let id: string = '';
</script>

<div class="range-wrapper">
	<input type="range" {id} bind:value {min} {max} {step} on:input />
	<div class="range-input">
		<input type="number" bind:value {min} {max} {step} />
	</div>
</div>

<style lang="scss">
	.range-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-width: 140px;
	}

	.range-input {
		display: flex;
		align-items: center;
		width: 100px;
		background: var(--bg-surface);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
		overflow: hidden;

		input {
			width: 100%;
			border: none;
			background: transparent;
			padding: 8px 10px;
			color: var(--text-color);
			font-size: 0.9em;
			font-weight: 500;
			text-align: center;
			outline: none;

			&::-webkit-inner-spin-button,
			&::-webkit-outer-spin-button {
				opacity: 1;
			}
		}
	}

	input[type='range'] {
		width: 100%;
		height: 6px;
		background: var(--bg-surface-active);
		border-radius: var(--radius-full);
		appearance: none;
		outline: none;
		cursor: pointer;
		transition: var(--transition-base);

		&:hover {
			background: var(--border-color-hover);

			&::-webkit-slider-thumb {
				transform: scale(1.1);
			}
		}

		&::-webkit-slider-thumb {
			appearance: none;
			width: 18px;
			height: 18px;
			background: var(--btn-primary-bg);
			border-radius: 50%;
			cursor: pointer;
			transition: var(--transition-base);
			box-shadow: var(--shadow-sm);
			border: 2px solid var(--text-on-primary);
		}

		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: var(--btn-primary-bg);
			border-radius: 50%;
			cursor: pointer;
			transition: var(--transition-base);
			box-shadow: var(--shadow-sm);
			border: 2px solid var(--text-on-primary);
		}
	}
</style>
