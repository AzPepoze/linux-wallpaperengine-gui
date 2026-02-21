<script lang="ts">
	export let label: string;
	export let isActive: boolean = false;
	export let onClick: () => void;

	let isClicking = false;
	let displayActive = false;

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		isClicking = true;
		displayActive = !displayActive;
		onClick();
		setTimeout(() => {
			isClicking = false;
		}, 600);
	}

	$: displayActive = isActive;
</script>

<button
	class="filter-item"
	class:active={displayActive}
	class:clicking={isClicking}
	on:click={handleClick}
>
	<div class="checkbox">
		{#if displayActive}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{/if}
	</div>
	<span>{label}</span>
</button>

<style lang="scss">
	@keyframes slideShineIn {
		0% {
			transform: translateX(-100%);
			opacity: 1;
		}
		100% {
			transform: translateX(100%);
			opacity: 1;
		}
	}

	.filter-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 10px;
		color: var(--text-muted);
		font-size: 0.9em;
		text-align: left;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		width: 100%;
		font-weight: 500;
		user-select: none;
		-webkit-user-select: none;
		position: relative;
		outline: none;
		background: transparent;
		overflow: hidden;

		&:focus {
			outline: none;
		}

		&:focus-visible {
			outline: none;
		}

		&.clicking::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				90deg,
				transparent 0%,
				rgba(0, 123, 255, 0.6) 50%,
				transparent 100%
			);
			animation: slideShineIn 0.6s ease-out;
			pointer-events: none;
			z-index: 0;
			border-radius: var(--radius-md);
		}

		.checkbox {
			width: 20px;
			height: 20px;
			min-width: 20px;
			border: 2px solid var(--border-color);
			border-radius: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			background: transparent;
			color: white;
			flex-shrink: 0;
			position: relative;
			z-index: 1;

			svg {
				width: 12px;
				height: 12px;
				opacity: 0;
				transform: scale(0.5);
				transition: all 0.2s ease;
			}
		}

		span {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			position: relative;
			z-index: 1;
		}

		&:hover {
			color: var(--text-color);
			background: rgba(0, 123, 255, 0.05);
			transition: all 0.2s ease;

			.checkbox {
				border-color: var(--btn-primary-bg);
				background: rgba(0, 123, 255, 0.05);
			}
		}

		&.active {
			background: rgba(0, 123, 255, 0.15);
			border-color: var(--btn-primary-bg);
			color: var(--text-color);

			.checkbox {
				background: var(--btn-primary-bg);
				border-color: var(--btn-primary-bg);

				svg {
					opacity: 1;
					transform: scale(1);
				}
			}
		}
	}
</style>
