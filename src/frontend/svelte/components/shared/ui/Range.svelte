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
		gap: 16px;
		width: 100%;
		min-width: 160px;
	}

	.range-input {
		display: flex;
		align-items: center;
		width: 80px;
		background: var(--bg-surface);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		overflow: hidden;
		transition: var(--transition-base);

		&:focus-within {
			border-color: var(--btn-primary-bg);
			box-shadow: 0 0 0 2px var(--focus-ring-light);
		}

		input {
			width: 100%;
			border: none;
			background: transparent;
			padding: 6px 8px;
			color: var(--text-color);
			font-size: 0.9em;
			font-weight: 600;
			text-align: center;
			outline: none;

			&::-webkit-inner-spin-button,
			&::-webkit-outer-spin-button {
				opacity: 0.5;
			}
		}
	}

	input[type='range'] {
		flex: 1;
		height: 6px;
		background: var(--bg-surface-active);
		border-radius: var(--radius-full);
		appearance: none;
		outline: none;
		cursor: pointer;
		transition: var(--transition-base);
		position: relative;

		&::-webkit-slider-runnable-track {
			width: 100%;
			height: 6px;
			cursor: pointer;
			background: var(--bg-surface-active);
			border-radius: var(--radius-full);
			border: 1px solid var(--border-color);
		}

		&::-webkit-slider-thumb {
			appearance: none;
			width: 20px;
			height: 20px;
			background: white;
			border: 2px solid var(--btn-primary-bg);
			border-radius: 50%;
			cursor: pointer;
			margin-top: -8px; /* Centers thumb on track */
			transition: all 0.2s ease;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);

			&:hover {
				transform: scale(1.2);
				box-shadow: 0 0 10px var(--shadow-primary);
			}
		}

		&:active::-webkit-slider-thumb {
			transform: scale(0.95);
		}

		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: white;
			border: 2px solid var(--btn-primary-bg);
			border-radius: 50%;
			cursor: pointer;
			transition: all 0.2s ease;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		}
	}
</style>
