<script lang="ts">
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';

	export let viewMode: 'grid' | 'list' | 'detail' = 'grid';
</script>

<div class="view-toggles">
	<Button
		variant={viewMode === 'grid' ? 'primary' : 'secondary'}
		on:click={() => (viewMode = 'grid')}
		title="Grid View"
	>
		<Icon name="grid_view" size={20} />
		<span>Grid</span>
	</Button>
	<Button
		variant={viewMode === 'list' || viewMode === 'detail'
			? 'primary'
			: 'secondary'}
		on:click={() =>
			(viewMode = viewMode === 'detail' ? 'detail' : 'list')}
		title="List View"
	>
		<Icon name="view_list" size={20} />
		<span>List</span>
	</Button>
</div>

<style>
	.view-toggles {
		display: flex;
		gap: 8px;
	}

	:global(.view-toggles .btn) {
		padding: 8px 12px !important;
		font-size: 0.85em !important;
	}
</style>
