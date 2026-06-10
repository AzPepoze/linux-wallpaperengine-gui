<script lang="ts">
	import SlidingCapsule from '@/ui/SlidingCapsule.svelte';

	export let viewMode: 'grid' | 'list' | 'detail' = 'grid';

	const options = [
		{ id: 'grid', label: 'Grid', icon: 'grid_view', title: 'Grid View' },
		{ id: 'list', label: 'List', icon: 'view_list', title: 'List View' }
	];

	function handleChange(id: string) {
		if (id === 'grid') {
			viewMode = 'grid';
		} else {
			viewMode = viewMode === 'detail' ? 'detail' : 'list';
		}
	}

	$: currentId = viewMode === 'grid' ? 'grid' : 'list';
</script>

<div class="view-toggles">
	<SlidingCapsule
		{options}
		selectedId={currentId}
		onChange={handleChange}
	/>
</div>

<style>
	.view-toggles {
		display: flex;
	}
</style>
