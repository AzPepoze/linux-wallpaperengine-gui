<script lang="ts">
	import { sidebarHidden } from '@/core/ui';
	import Icon from '@/ui/Icon.svelte';

	$: isVisible = !$sidebarHidden;
</script>

<button
	type="button"
	class="sidebar-toggle"
	class:active={isVisible}
	title="Toggle Sidebar"
	aria-label="Toggle Sidebar"
	aria-pressed={isVisible}
	on:click={() => sidebarHidden.update((v) => !v)}
>
	<Icon name="view_sidebar" size={20} />
</button>

<style lang="scss">
	.sidebar-toggle {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: none;
		border-radius: 10px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.2s ease, background-color 0.2s ease;

		&:hover {
			background-color: var(--bg-surface-hover);
		}

		&.active {
			background-color: var(--btn-primary-bg);
			color: #fff;

			&:hover {
				background-color: var(--btn-primary-hover-bg);
			}
		}
	}
</style>
