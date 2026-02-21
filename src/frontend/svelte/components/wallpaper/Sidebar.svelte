<script lang="ts">
	import {
		getDominantColor,
		isLight,
		getPalette
	} from '../../utils/colorHelper';
	import { sidebarWidth } from '../../scripts/ui';
	import { onDestroy } from 'svelte';
	import WorkshopItemSidebar from './WorkshopItemSidebar.svelte';
	import LocalWallpaperSidebar from './LocalWallpaperSidebar.svelte';
	import type { Wallpaper } from '../../../shared/types';
	import DownloadIcon from '../../icons/DownloadIcon.svelte';
	import WorkshopIcon from '../../icons/WorkshopIcon.svelte';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};

	let sidebarContentElement: HTMLDivElement;
	let backgroundColor = '#2a2a2a';
	let textColor = '#fff';
	let palette: [number, number, number][] = [];
	let isResizing = false;
	let btnPrimaryTextColor = '#fff';
	let dominantColorArray: [number, number, number] | null = null;
	let accentColor: [number, number, number] | null = null;

	$: {
		if (selectedWallpaper && selectedWallpaper.previewPath) {
			getDominantColor(selectedWallpaper.previewPath).then(
				(dominantColor) => {
					if (dominantColor) {
						dominantColorArray = dominantColor;
						backgroundColor = `rgb(${dominantColor.join(',')})`;
						textColor = isLight(dominantColor)
							? '#000'
							: '#fff';
					}
				}
			);
			getPalette(selectedWallpaper.previewPath, 8).then((p) => {
				if (p) {
					palette = p;
				}
			});
		} else {
			dominantColorArray = null;
			accentColor = null;
			backgroundColor = '#2a2a2a';
			textColor = '#fff';
			palette = [];
		}
	}

	$: {
		if (dominantColorArray && palette.length > 0) {
			const targetIsLight = !isLight(dominantColorArray);
			let contrastingColor = palette.find(c => isLight(c) === targetIsLight);
			
			if (contrastingColor) {
				accentColor = contrastingColor;
			} else {
				accentColor = targetIsLight ? [255, 255, 255] : [0, 0, 0];
			}
		} else {
			accentColor = null;
		}

		if (accentColor) {
			btnPrimaryTextColor = isLight(accentColor) ? '#000' : '#fff';
		} else {
			btnPrimaryTextColor = backgroundColor;
		}
	}

	let lastWallpaperId: string | null = null;
	$: if (sidebarContentElement && selectedWallpaper) {
		if (selectedWallpaper.folderName !== lastWallpaperId) {
			sidebarContentElement.scrollTop = 0;
			lastWallpaperId = selectedWallpaper.folderName;
		}
	}

	function close() {
		onClose();
	}

	function startResizing(e: MouseEvent) {
		isResizing = true;
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', stopResizing);
		document.body.style.cursor = 'col-resize';
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = window.innerWidth - e.clientX - 40;
		if (newWidth >= 250 && newWidth <= 800) {
			sidebarWidth.set(newWidth);
		}
	}

	function stopResizing() {
		isResizing = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', stopResizing);
		document.body.style.cursor = 'default';
	}

	onDestroy(() => {
		stopResizing();
	});
</script>

<div
	class="sidebar"
	class:open={selectedWallpaper}
	class:resizing={isResizing}
	style="
          --sidebar-bg: {backgroundColor};
          --sidebar-text: {textColor};
          --btn-text-color: {btnPrimaryTextColor};
          --palette-primary: {palette.length > 0
		? `rgb(${palette[0].join(',')})`
		: 'var(--btn-primary-bg)'};
          --palette-secondary: {palette.length > 1
		? `rgb(${palette[1].join(',')})`
		: 'var(--btn-secondary-bg)'};
          --palette-track: {accentColor
		? `rgb(${accentColor.join(',')})`
		: 'var(--sidebar-text)'};
          width: {selectedWallpaper ? $sidebarWidth + 'px' : '0'};
     "
>
	{#if selectedWallpaper}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="resize-handle"
			class:resizing={isResizing}
			on:mousedown={startResizing}
		></div>
	{/if}
	<div class="sidebar-content" bind:this={sidebarContentElement}>
		{#if selectedWallpaper?.previewPath}
			<img
				src={selectedWallpaper.previewPath}
				alt="{selectedWallpaper.projectData?.title ||
					selectedWallpaper.folderName} preview"
				class="preview-image"
			/>
		{/if}

		<button
			type="button"
			class="workshop-btn"
			on:click={() => {
				const url = `steam://url/CommunityFilePage/${selectedWallpaper?.folderName}`;
				if (url) {
					window.electronAPI.openExternal(url);
					console.log('Opening URL:', url);
				}
			}}
		>
			{#if selectedWallpaper?.projectData?.workshop_accepted === false}
				<DownloadIcon width="18" height="18" />
				Subscribe
			{:else}
				<WorkshopIcon width="18" height="18" />
				View on Workshop
			{/if}
		</button>

		{#if selectedWallpaper}
			{#if selectedWallpaper.projectData?.isWorkshop}
				<WorkshopItemSidebar wallpaper={selectedWallpaper} />
			{:else}
				<LocalWallpaperSidebar
					wallpaper={selectedWallpaper}
					{textColor}
					{palette}
				/>
			{/if}
		{/if}
	</div>
	<div class="sidebar-footer">
		<button type="button" class="close-btn" on:click={close}>Close</button
		>
	</div>
</div>

<style lang="scss">
	.sidebar {
		/* Dynamic Button Colors from Palette */
		--btn-primary-bg: var(--palette-track);
		--btn-primary-hover-bg: var(--sidebar-text);
		--sidebar-btn-text-final: var(--btn-text-color);
		--btn-primary-text: var(--btn-text-color);
		--text-color: var(--sidebar-text);
		--text-muted: var(--sidebar-text);
		--border-color: var(--sidebar-text);
		--border-color-hover: color-mix(
			in srgb,
			var(--sidebar-text),
			transparent 80%
		);
		--bg-surface: transparent;
		--bg-surface-hover: color-mix(
			in srgb,
			var(--palette-track),
			transparent 80%
		);
		--bg-surface-active: transparent;
		--top-bar-bg: color-mix(in srgb, var(--sidebar-bg), black 20%);
		--bg-dropdown: color-mix(in srgb, var(--sidebar-bg), black 15%);

		width: 0;
		background-color: var(--sidebar-bg);
		color: var(--text-color);
		box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
		transition: var(--transition-slow);
		border-radius: 15px;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		&.resizing {
			transition: none;
		}

		.resize-handle {
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			width: 5px;
			cursor: col-resize;
			z-index: 10;
			transition: var(--transition-base);
			border-radius: var(--radius-md);
			border: 2px dashed var(--btn-secondary-bg);

			&:hover,
			&.resizing {
				background-color: #007bff;
				width: 7px;
				box-shadow: 2px 0 10px #007bff;
			}
		}

		.sidebar-content {
			flex-grow: 1;
			overflow-y: auto;
			overflow-x: hidden;
			padding-bottom: 20px;
			text-align: left;
			border-radius: 15px;

			:global(svg) {
				color: inherit;
				filter: invert(1);
			}

			:global(img) {
				max-width: 100%;
				height: auto;
			}

			:global(p) {
				white-space: pre-wrap;
			}

			.preview-image {
				width: 500px;
				max-width: 100%;
				aspect-ratio: 1 / 1;
				border-radius: 20px;
				margin: 20px auto 15px auto;
				display: block;
				object-fit: cover;
			}
		}

		.sidebar-footer {
			padding: 10px 0;
			display: flex;
			justify-content: center;
			align-items: center;
			flex-shrink: 0;
			position: relative;
			z-index: 5;
		}

		.close-btn,
		.workshop-btn {
			background-color: var(--btn-primary-bg);
			border: none;
			font-size: 1em;
			font-weight: bold;
			cursor: pointer;
			color: var(--sidebar-btn-text-final);
			width: 100%;
			height: 40px;
			border-radius: 25px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 8px;
			transition: all 0.3s ease;

			&:hover {
				filter: brightness(1.5);
			}
		}

		.workshop-btn {
			margin-block: 10px;
		}

		&.open {
			min-width: 250px;
			max-width: 800px;
			flex-shrink: 0;
			padding: 5px 10px;
			margin: 20px 0 20px 20px;

			.sidebar-content {
				padding: 0 10px;
			}
		}

		:global(input[type='range']) {
			background: var(--palette-track) !important;

			&:hover {
				background: var(--palette-track) !important;
			}
		}

		:global(p) {
			margin: 0 0 12px 0;
			font-size: 0.95em;
			line-height: 1.5;
		}

		:global(h3) {
			margin: 0 0 16px 0;
			font-size: 1.3em;
			font-weight: 600;
		}

		:global(strong) {
			font-weight: 600;
			color: var(--sidebar-text);
		}

		:global(hr) {
			border: none;
			border-top: 1px solid
				color-mix(in srgb, var(--sidebar-text), transparent 70%);
			margin: 16px 0;
		}

		:global(a) {
			display: inline-block;
			background: color-mix(
				in srgb,
				var(--sidebar-text),
				transparent 80%
			);
			color: var(--sidebar-text);
			padding: 8px 16px;
			border-radius: 6px;
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;

			&:hover {
				background: color-mix(
					in srgb,
					var(--sidebar-text),
					transparent 60%
				);
				transform: translateY(-2px);
			}
		}
	}
</style>
