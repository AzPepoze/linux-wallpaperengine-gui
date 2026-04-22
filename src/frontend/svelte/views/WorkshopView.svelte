<script lang="ts">
	import Workshop from '@/components/workshop/Workshop.svelte';
	import { scale } from 'svelte/transition';

	const pageTransitionInParams = {
		duration: 200,
		delay: 200,
		start: 0.99
	};

	const pageTransitionOutParams = {
		duration: 200,
		start: 0.99
	};
</script>

<div
	class="view-container"
	in:scale={pageTransitionInParams}
	out:scale={pageTransitionOutParams}
>
	<Workshop />
</div>

<style lang="scss">
	.view-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
		box-sizing: border-box;
		padding: 20px;
	}
</style>
