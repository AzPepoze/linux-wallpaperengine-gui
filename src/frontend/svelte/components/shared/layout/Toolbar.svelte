<script lang="ts">
	import Icon from '@/components/shared/ui/Icon.svelte';
	export let title: string = '';
	export let showRefresh: boolean = false;
	export let onRefresh: () => void = () => {};
</script>

<div class="toolbar">
	<div class="left-actions">
		<slot name="left" />
		{#if title}
			<span class="toolbar-title">{title}</span>
		{/if}
	</div>

	<div class="center-content">
		<slot name="center" />
	</div>

	<div class="right-actions">
		<slot name="right" />
		{#if showRefresh}
			<button class="refresh-btn" on:click={onRefresh} title="Refresh">
				<Icon name="refresh" size={20} />
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	.toolbar {
		padding: 10px 15px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		background: var(--top-bar-bg);
		border-radius: 20px;
		gap: 15px;
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0;

		.left-actions, .right-actions {
			display: flex;
			align-items: center;
			gap: 10px;
			flex: 1;
		}

		.left-actions {
			justify-content: flex-start;
		}

		.right-actions {
			justify-content: flex-end;
		}

		.center-content {
			display: flex;
			align-items: center;
			justify-content: center;
			flex: 0 1 auto;
		}

		.toolbar-title {
			font-size: 0.9em;
			color: var(--text-muted);
			font-weight: 500;
		}

		.refresh-btn {
			background: none;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 5px;
			border-radius: 50%;
			transition: var(--transition-base);

			&:hover {
				background: var(--bg-surface-hover);
				color: var(--btn-primary-bg);
			}
		}
	}
</style>
