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
		position: relative;
		display: inline-block;
		width: 48px;
		height: 26px;
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
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-surface-active);
		transition: var(--transition-slow);
		border-radius: var(--radius-full);
		border: 1px solid var(--border-color);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

		&:before {
			position: absolute;
			content: '';
			height: 20px;
			width: 20px;
			left: 2px;
			bottom: 2px;
			background-color: #fff;
			transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
			border-radius: 50%;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		}
	}

	input:checked + .slider {
		background: linear-gradient(135deg, var(--btn-primary-bg) 0%, var(--btn-primary-hover-bg) 100%);
		border-color: transparent;
		box-shadow: 0 0 10px var(--shadow-primary);

		&:before {
			transform: translateX(22px);
			background-color: white;
		}
	}

	input:focus + .slider {
		box-shadow: 0 0 0 3px var(--focus-ring);
	}

	.toggle-switch:hover .slider {
		filter: brightness(1.1);
		border-color: var(--border-color-hover);
	}
</style>
