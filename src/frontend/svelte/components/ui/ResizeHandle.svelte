<script lang="ts">
	export let width: number = 280;
	export let minWidth: number = 200;
	export let maxWidth: number = 600;
	export let onResize: (newWidth: number) => void = () => {};
	export let style: string = '';
	export let position: 'right' | 'left' = 'right';
	export let calculateWidth: (clientX: number) => number = (clientX) =>
		Math.max(minWidth, Math.min(maxWidth, clientX));

	let isResizing = false;

	function handleMouseDown() {
		isResizing = true;
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.body.style.userSelect = 'none';
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = calculateWidth(e.clientX);
		width = newWidth;
		onResize(newWidth);
	}

	function handleMouseUp() {
		isResizing = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
		document.body.style.userSelect = '';
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<button
	type="button"
	class="resize-handle"
	class:resizing={isResizing}
	class:position-left={position === 'left'}
	class:position-right={position === 'right'}
	on:mousedown={handleMouseDown}
	{style}
	aria-label="Resize sidebar"
	tabindex="-1"
></button>

<style lang="scss">
	.resize-handle {
		position: absolute;
		top: 0;
		width: 5px;
		height: 100%;
		cursor: col-resize;
		background: transparent;
		border-radius: var(--radius-md);
		outline: none;
		padding: 0;
		transition: var(--transition-base);
		z-index: 10;

		&.position-right {
			right: 0;
			border-left: 2px dashed var(--border-color);
			border-right: none;
			border-top: none;
			border-bottom: none;

			&:hover,
			&.resizing {
				box-shadow: -2px 0 10px #007bff;
			}
		}

		&.position-left {
			left: 0;
			border-right: 2px dashed var(--border-color);
			border-left: none;
			border-top: none;
			border-bottom: none;

			&:hover,
			&.resizing {
				box-shadow: 2px 0 10px #007bff;
			}
		}

		&:hover,
		&.resizing {
			background-color: #007bff;
			width: 7px;
		}

		&:focus {
			outline: none;
		}
	}
</style>
