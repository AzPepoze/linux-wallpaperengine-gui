<script lang="ts">
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import Icon from '@/ui/Icon.svelte';

	export let size: number = 14;
</script>

<div
	class="downloaded-badge"
	in:scale={{
		start: 0.8,
		duration: 300,
		easing: backOut
	}}
	out:scale={{ start: 0.5, duration: 200 }}
	title="Downloaded"
>
	<Icon name="check" {size} />
</div>

<style lang="scss">
	.downloaded-badge {
		position: absolute;
		top: 5px;
		right: 5px;
		z-index: 5;
		background: #4caf50;
		color: white;
		border: 2px solid white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		pointer-events: none;
	}
</style>
