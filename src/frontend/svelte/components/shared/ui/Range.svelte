<script lang="ts">
	export let value: number;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let id: string = '';

	$: percentage = ((value - min) / (max - min)) * 100;
</script>

<div class="range-wrapper">
	<input
		type="range"
		{id}
		bind:value
		{min}
		{max}
		{step}
		on:input
		style="--progress-percent: {percentage}%"
	/>
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
		width: 64px;
		height: 32px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: var(--radius-full);
		border: 1px solid rgba(255, 255, 255, 0.08);
		overflow: hidden;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			background: rgba(255, 255, 255, 0.08);
			border-color: rgba(255, 255, 255, 0.15);
		}

		&:focus-within {
			border-color: var(--btn-primary-bg);
			background: rgba(var(--primary-raw-rgb), 0.08);
			box-shadow: 0 0 0 2px var(--focus-ring-light);
		}

		input {
			width: 100%;
			border: none;
			background: transparent;
			padding: 4px 6px;
			color: var(--text-color);
			font-size: 0.85em;
			font-weight: 700;
			text-align: center;
			outline: none;

			&::-webkit-inner-spin-button,
			&::-webkit-outer-spin-button {
				display: none;
			}
		}
	}

	input[type='range'] {
		flex: 1;
		height: 24px;
		background: transparent;
		appearance: none;
		outline: none;
		cursor: pointer;
		margin: 0;
		position: relative;

		// Track
		&::-webkit-slider-runnable-track {
			width: 100%;
			height: 6px;
			cursor: pointer;
			background: linear-gradient(
				to right,
				var(--btn-primary-bg) 0%,
				var(--btn-primary-bg) var(--progress-percent, 0%),
				var(--bg-surface-active) var(--progress-percent, 0%),
				var(--bg-surface-active) 100%
			);
			border-radius: var(--radius-full);
			border: none;
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		}

		// Thumb
		&::-webkit-slider-thumb {
			appearance: none;
			width: 16px;
			height: 16px;
			background: #ffffff;
			border: none;
			border-radius: 50%;
			cursor: pointer;
			margin-top: -5px; /* Centers thumb on 6px track */
			transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), 
			            box-shadow 0.2s ease;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		}

		&:hover {
			&::-webkit-slider-runnable-track {
				height: 8px;
			}
			&::-webkit-slider-thumb {
				transform: scale(1.25);
				box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), 
				            0 0 0 4px rgba(255, 255, 255, 0.2);
				margin-top: -4px; /* Centers on 8px track */
			}
		}

		&:active {
			&::-webkit-slider-thumb {
				transform: scale(1.4);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 
				            0 0 0 6px rgba(var(--primary-raw-rgb), 0.3);
			}
		}

		// Firefox track and thumb
		&::-moz-range-track {
			width: 100%;
			height: 6px;
			cursor: pointer;
			background: linear-gradient(
				to right,
				var(--btn-primary-bg) 0%,
				var(--btn-primary-bg) var(--progress-percent, 0%),
				var(--bg-surface-active) var(--progress-percent, 0%),
				var(--bg-surface-active) 100%
			);
			border-radius: var(--radius-full);
			border: none;
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		}

		&::-moz-range-thumb {
			width: 16px;
			height: 16px;
			background: #ffffff;
			border: none;
			border-radius: 50%;
			cursor: pointer;
			transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), 
			            box-shadow 0.2s ease;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		}

		&:hover::-moz-range-track {
			height: 8px;
		}

		&:hover::-moz-range-thumb {
			transform: scale(1.25);
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), 
			            0 0 0 4px rgba(255, 255, 255, 0.2);
		}

		&:active::-moz-range-thumb {
			transform: scale(1.4);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 
			            0 0 0 6px rgba(var(--primary-raw-rgb), 0.3);
		}
	}
</style>
