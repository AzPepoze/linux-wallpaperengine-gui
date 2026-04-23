<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		items: any[];
		itemWidth: number;
		itemHeight: number;
		gap: number;
		padding?: number;
		container: HTMLElement | null;
		children: Snippet<[{ visibleItems: any[]; startIndex: number }]>;
	}

	let {
		items = [],
		itemWidth,
		itemHeight,
		gap,
		padding = 10,
		container,
		children
	}: Props = $props();

	let containerWidth = $state(0);
	let scrollTop = $state(0);
	let viewportHeight = $state(0);
	let viewportElement: HTMLElement | null = $state(null);

	// Calculate how many items can actually fit in the available width
	let itemsPerRow = $derived(
		Math.max(
			1,
			Math.floor(((containerWidth || 1000) + gap) / (itemWidth + gap))
		)
	);
	let totalRows = $derived(Math.ceil(items.length / itemsPerRow));
	let totalHeight = $derived(
		totalRows * (itemHeight + gap) - gap + padding * 2
	);

	let visibleRange = $derived.by(() => {
		const overscan = 2;
		const startRow = Math.max(
			0,
			Math.floor((scrollTop - padding) / (itemHeight + gap)) - overscan
		);
		const endRow =
			Math.ceil(
				(scrollTop - padding + viewportHeight) / (itemHeight + gap)
			) + overscan;

		const start = startRow * itemsPerRow;
		const end = Math.min(items.length, (endRow + 1) * itemsPerRow);

		return { start, end, startRow };
	});

	let visibleItems = $derived(
		items.slice(visibleRange.start, visibleRange.end)
	);

	function handleScroll() {
		if (container) {
			scrollTop = container.scrollTop;
			viewportHeight = container.clientHeight;
		}
	}

	function refreshMeasurements() {
		if (container && container.clientWidth > 0) {
			containerWidth = container.clientWidth;
			viewportHeight = container.clientHeight;
			scrollTop = container.scrollTop;
		}
	}

	// Handle container events and observers
	$effect(() => {
		if (!container) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) {
					containerWidth = entry.contentRect.width;
					viewportHeight = entry.target.clientHeight;
					handleScroll();
				}
			}
		});

		resizeObserver.observe(container);
		container.addEventListener('scroll', handleScroll, { passive: true });

		// Initial sync
		refreshMeasurements();

		return () => {
			resizeObserver.disconnect();
			container.removeEventListener('scroll', handleScroll);
		};
	});

	// Use an effect to periodically sync if measurements are 0 (e.g. after coming back from hidden)
	$effect(() => {
		if (containerWidth === 0 && container && container.clientWidth > 0) {
			refreshMeasurements();
		}
	});

	// Secondary observer for the viewport itself
	$effect(() => {
		if (!viewportElement) return;

		const resizeObserver = new ResizeObserver(() => {
			if (container && container.clientWidth > 0) {
				containerWidth = container.clientWidth;
				handleScroll();
			}
		});

		resizeObserver.observe(viewportElement);
		return () => resizeObserver.disconnect();
	});
</script>

<div
	bind:this={viewportElement}
	class="virtual-grid-viewport"
	style="height: {totalHeight}px; position: relative; width: 100%;"
>
	<div
		class="virtual-grid-content"
		style="
            position: absolute;
            top: {visibleRange.startRow * (itemHeight + gap) + padding}px;
            left: 0;
            width: 100%;
            display: grid;
            grid-template-columns: repeat({itemsPerRow}, {itemWidth}px);
            gap: {gap}px;
            justify-content: center;
        "
	>
		{@render children?.({ visibleItems, startIndex: visibleRange.start })}
	</div>
</div>

<style>
	.virtual-grid-viewport {
		pointer-events: none;
		min-width: 100%;
		flex: 1;
	}
	.virtual-grid-content {
		pointer-events: auto;
	}
</style>
