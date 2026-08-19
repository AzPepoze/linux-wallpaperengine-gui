<script lang="ts">
	export let src: string | undefined = undefined;
	export let alt: string = '';
	export let placeholder: string = '';

	interface Layer {
		id: number;
		src: string | undefined;
		zIndex: number;
		animating: boolean;
	}

	let nextId = 1;
	let nextZ = 1;

	let layers: Layer[] = [
		{
			id: nextId++,
			src: src,
			zIndex: nextZ++,
			animating: false
		}
	];

	$: if (src !== layers[layers.length - 1]?.src) {
		const newLayer: Layer = {
			id: nextId++,
			src: src,
			zIndex: nextZ++,
			animating: true
		};
		layers = [...layers, newLayer];
	}

	function handleAnimationEnd(id: number) {
		// 1. Remove all old layers underneath first
		const remaining = layers.filter((l) => l.id >= id);

		// 2. After old layers are removed, lower zIndex to base 1
		layers = remaining.map((l) => {
			if (l.id === id) {
				return {
					...l,
					zIndex: 1,
					animating: false
				};
			}
			return l;
		});

		nextZ = 2;
	}
</script>

<div class="screen-preview-box">
	{#each layers as layer (layer.id)}
		{#if layer.src}
			<img
				src={layer.src}
				{alt}
				class="layer"
				class:fade-in={layer.animating}
				style="z-index: {layer.zIndex};"
				on:animationend={() => handleAnimationEnd(layer.id)}
			/>
		{:else}
			<div
				class="layer placeholder"
				class:fade-in={layer.animating}
				style="z-index: {layer.zIndex};"
				on:animationend={() => handleAnimationEnd(layer.id)}
			>
				{placeholder}
			</div>
		{/if}
	{/each}
</div>

<style lang="scss">
	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.screen-preview-box {
		--size: 150px;
		width: var(--size);
		height: var(--size);
		background-color: var(--preview-placeholder-bg);
		margin-bottom: 8px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		position: relative;

		.layer {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
			opacity: 1;

			&.fade-in {
				opacity: 0;
				animation: fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
				will-change: opacity;
			}
		}

		.placeholder {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.8em;
			color: var(--text-muted);
			text-align: center;
			padding: 8px;
			background-color: var(--preview-placeholder-bg);
		}
	}
</style>
