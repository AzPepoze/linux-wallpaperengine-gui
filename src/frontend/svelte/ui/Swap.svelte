<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { motionMs } from '@/ui/scripts/motion';

	// Content swaps only when value changes, so equal values stay still.
	export let value: unknown;
	export let delay: number = 0;
	export let y: number = 8;
</script>

<span class="swap">
	{#key value}
		<span
			class="swap-item"
			in:fly={{ y, duration: motionMs(260), delay: motionMs(delay) }}
			out:fade={{ duration: motionMs(120) }}
		>
			<slot />
		</span>
	{/key}
</span>

<style>
	.swap {
		display: grid;
		min-width: 0;
	}

	.swap-item {
		grid-area: 1 / 1;
		min-width: 0;
	}
</style>
