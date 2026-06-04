<script lang="ts">
	export let label: string;
	export let id: string = '';
	export let vertical: boolean = false;
	export let description: string = '';
	export let alignEnd: boolean = true;
</script>

<div class="setting-item" class:vertical class:align-end={alignEnd}>
	<div class="info">
		{#if $$slots.label}
			<div class="label-slot">
				<slot name="label" />
			</div>
		{:else}
			<label for={id}>{label}</label>
		{/if}
		{#if description}
			<p class="description">{description}</p>
		{/if}
	</div>
	<div class="control">
		<slot />
	</div>
</div>

<!-- This fixes the unclosed tags in the original source -->
<style lang="scss">
	.setting-item {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		flex-wrap: wrap;
		gap: 24px;
		padding: 20px;
		background: var(--bg-surface);
		border-radius: var(--radius-xl);
		transition: 0.2s ease-out;
		border: 1px solid var(--border-color);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

		&:global(:has(.select-trigger.active)) {
			z-index: 1;
		}

		@media (min-width: 900px) {
			&.align-end {
				justify-content: space-between;
				gap: 32px;

				.info {
					flex: 1;
				}

				.control {
					justify-content: flex-end;
					flex: 0 0 auto;
					margin-left: auto;
				}
			}
		}

		&:hover {
			filter: brightness(1.2);
			border-color: var(--border-color-hover);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		}

		&.vertical {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
			justify-content: flex-start;

			.info {
				flex: none;
				text-align: inherit;
			}

			.control {
				flex-direction: column;
				align-items: flex-start;
				gap: 12px;
				justify-content: flex-start;
				width: 100%;
			}
		}

		.info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6px;
			min-width: 0;
			text-align: left;

			label {
				font-weight: 700;
				font-size: 1.05em;
				color: var(--text-color);
				cursor: pointer;
				letter-spacing: -0.01em;
			}

			.description {
				font-size: 0.85em;
				color: var(--text-muted);
				margin: 0;
				line-height: 1.5;
			}
		}

		.control {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			min-width: 0;
			flex: 0 0 auto;
		}
	}

	:global(.setting-item .control > *) {
		width: auto;
	}
</style>
