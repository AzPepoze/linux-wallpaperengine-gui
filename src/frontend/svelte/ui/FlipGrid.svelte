<script lang="ts">
	import { type Snippet } from 'svelte';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { captureRects, animateWarp } from './scripts/gridWarp';

	interface Props {
		items: any[];
		itemWidth: number;
		gap: number;
		padding?: number;
		children: Snippet<[{ visibleItems: any[]; startIndex: number }]>;
	}

	let { items = [], itemWidth, gap, padding = 10, children }: Props = $props();

	let containerElement: HTMLDivElement | null = $state(null);
	let gridElement: HTMLDivElement | null = $state(null);
	let containerWidth = $state(0);

	let itemsPerRow = $derived(
		Math.max(1, Math.floor(((containerWidth || 1000) + gap) / (itemWidth + gap)))
	);

	$effect(() => {
		if (!containerElement) return;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) containerWidth = entry.contentRect.width;
			}
		});
		resizeObserver.observe(containerElement);
		containerWidth = containerElement.clientWidth;
		return () => resizeObserver.disconnect();
	});

	let previousRectsByKey = new Map<string, DOMRect>();
	let isFirstRender = true;

	let isWarpEnabled = $derived(
		!$settingsStore?.performanceMode && ($settingsStore?.enableGridWarpAnimation ?? true)
	);

	$effect.pre(() => {
		items;
		itemsPerRow;
		if (!isWarpEnabled) return;
		if (isFirstRender || !gridElement) return;
		previousRectsByKey = captureRects(gridElement);
	});

	$effect(() => {
		items;
		itemsPerRow;
		if (!isWarpEnabled) return;
		if (isFirstRender) {
			isFirstRender = false;
			return;
		}
		if (!gridElement || previousRectsByKey.size === 0) return;
		animateWarp(gridElement, previousRectsByKey).then(() => previousRectsByKey.clear());
	});
</script>

<div bind:this={containerElement} class="flip-outer" style="padding: {padding}px;">
	<div
		bind:this={gridElement}
		class="flip-grid"
		style="gap: {gap}px; grid-template-columns: repeat({itemsPerRow}, {itemWidth}px);"
	>
		{@render children?.({ visibleItems: items, startIndex: 0 })}
	</div>
</div>

<style>
	.flip-outer {
		width: 100%;
		min-width: 0;
	}
	.flip-grid {
		display: grid;
		justify-content: center;
		width: 100%;
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.flip-grid :global([data-flip-key]) {
			animation: none !important;
		}
	}
</style>
