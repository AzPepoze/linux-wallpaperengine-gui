<script lang="ts">
	export let checked: boolean = false;
	export let id: string =
		'toggle-' + Math.random().toString(36).substr(2, 9);
	export let onChange: (checked: boolean) => void = () => {};

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		onChange(checked);
	}
</script>

<label class="toggle-switch" for={id}>
	<input type="checkbox" {id} {checked} on:change={handleChange} />
	<span class="slider"></span>
</label>

<style lang="scss">
	.toggle-switch {
		/* Same fill and track as Range, so controls match in every theme */
		--range-fill: color-mix(in srgb, var(--btn-primary-bg) 70%, white);
		--range-track: color-mix(in srgb, var(--text-color) 18%, transparent);

		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		flex-shrink: 0;

		input {
			opacity: 0;
			width: 0;
			height: 0;
			position: absolute;
		}
	}

	.slider {
		position: absolute;
		inset: 0;
		cursor: pointer;
		background-color: var(--range-track);
		border-radius: var(--radius-full);
		transition: background-color 0.25s ease;

		&::before {
			content: '';
			position: absolute;
			top: 3px;
			left: 3px;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background-color: #fff;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
			transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	input:checked + .slider {
		background-color: var(--range-fill);

		&::before {
			transform: translateX(20px);
		}
	}

	input:focus-visible + .slider {
		box-shadow: 0 0 0 3px var(--focus-ring);
	}

	.toggle-switch:hover .slider {
		filter: brightness(1.1);
	}
</style>
