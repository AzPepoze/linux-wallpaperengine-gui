<script lang="ts">
	import { slide } from 'svelte/transition';
	import Icon from '@/components/shared/ui/Icon.svelte';

	export let title: string;
	export let isExpanded: boolean = false;

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
</script>

<div class="collapse-container" class:expanded={isExpanded}>
	<button class="collapse-header" on:click={toggleExpanded}>
		<div class="collapse-title">
			<span class="collapse-icon">
				<Icon name={isExpanded ? 'expand_more' : 'chevron_right'} size={18} />
			</span>
			<span>{title}</span>
		</div>
		<div
			class="header-actions"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="presentation"
		>
			<slot name="header-actions" />
		</div>
	</button>

	{#if isExpanded}
		<div class="collapse-content" transition:slide={{ duration: 200 }}>
			<slot />
		</div>
	{/if}
</div>

<style lang="scss">
	.collapse-container {
		margin-bottom: 20px;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 12px;
		transition: all 0.2s ease;

		.collapse-header {
			background: none;
			border: none;
			width: 100%;
			padding: 12px 0;
			cursor: pointer;
			display: flex;
			align-items: center;
			transition: all 0.2s ease;

			&:hover {
				color: var(--text-color);
			}

			.collapse-title {
				display: flex;
				align-items: center;
				gap: 10px;
				width: 100%;

				.collapse-icon {
					font-size: 0.7em;
					color: #92deff;
					transition: transform 0.2s ease;
					flex-shrink: 0;
				}

				span:last-child {
					font-size: 0.9em;
					text-transform: uppercase;
					letter-spacing: 1px;
					font-weight: 700;
					color: var(--text-color);
					background: linear-gradient(
						135deg,
						#92deff 0%,
						#b4e8ff 100%
					);
					background-clip: text;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
				}
			}

			.header-actions {
				display: flex;
				gap: 8px;
				margin-left: auto;
				padding-left: 10px;
			}
		}

		&.expanded .collapse-header {
			background: rgba(var(--primary-raw-rgb), 0.15);
			border-radius: var(--radius-md);
			padding: 8px 12px;
			margin: 0 -20px;
			padding-left: 32px;
			padding-right: 32px;
		}

		.collapse-content {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 8px 0;
		}
	}
</style>
