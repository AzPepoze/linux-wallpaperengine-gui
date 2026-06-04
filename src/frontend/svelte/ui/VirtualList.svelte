<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		items: any[];
		itemHeight: number;
		gap: number;
		padding?: number;
		container: HTMLElement | null;
		children: Snippet<[{ visibleItems: any[]; startIndex: number }]>;
	}

	let {
		items = [],
		itemHeight,
		gap,
		padding = 20,
		container,
		children
	}: Props = $props();

	let scrollTop = $state(0);
	let viewportHeight = $state(0);

	let totalHeight = $derived(items.length * (itemHeight + gap) - gap + padding * 2);

	let visibleRange = $derived.by(() => {
		const overscan = 5;
		const start = Math.max(0, Math.floor((scrollTop - padding) / (itemHeight + gap)) - overscan);
		const end = Math.min(
			items.length,
			Math.ceil((scrollTop - padding + viewportHeight) / (itemHeight + gap)) + 1 + overscan
		);

		return { start, end };
	});

	let visibleItems = $derived(items.slice(visibleRange.start, visibleRange.end));

	function handleScroll() {
		if (container) {
			scrollTop = container.scrollTop;
			viewportHeight = container.clientHeight;
		}
	}

	function refreshMeasurements() {
		if (container && container.clientHeight > 0) {
			viewportHeight = container.clientHeight;
			scrollTop = container.scrollTop;
		}
	}

	$effect(() => {
		if (!container) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target.clientHeight > 0) {
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

	// Sync when becoming visible
	$effect(() => {
		if (viewportHeight === 0 && container && container.clientHeight > 0) {
			refreshMeasurements();
		}
	});
</script>

<div class="virtual-list-viewport" style="height: {totalHeight}px; position: relative; width: 100%;">
	<div
		class="virtual-list-content"
		style="
            position: absolute;
            top: {visibleRange.start * (itemHeight + gap) + padding}px;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            gap: {gap}px;
            padding: 0 {padding}px;
        "
	>
		{@render children?.({ visibleItems, startIndex: visibleRange.start })}
	</div>
</div>

<style>
	.virtual-list-viewport {
		pointer-events: none;
	}
	.virtual-list-content {
		pointer-events: auto;
	}
</style>
