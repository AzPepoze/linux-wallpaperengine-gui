<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sidebarWidth } from '@/scripts/shared/ui';
	import { settingsStore } from '@/scripts/settings/settings';
	import {
		calculateSidebarTheme,
		DEFAULT_THEME,
		type SidebarTheme
	} from '@/scripts/home/sidebarTheme';
	import type { Wallpaper } from '@shared/types';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};

	let isResizing = false;
	let theme: SidebarTheme = DEFAULT_THEME;

	$: {
		if (selectedWallpaper) {
			calculateSidebarTheme(selectedWallpaper, $settingsStore).then(
				(t) => {
					theme = t;
				}
			);
		} else {
			theme = DEFAULT_THEME;
		}
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
	class="sidebar-shell"
	class:open={!!selectedWallpaper}
	class:resizing={isResizing}
	class:dynamic-theme={$settingsStore?.dynamicSidebarTheme}
	style="
		{$settingsStore?.dynamicSidebarTheme && selectedWallpaper
		? `
          --sidebar-bg: ${theme.backgroundColor};
          --sidebar-text: ${theme.textColor};
          --btn-text-color: ${theme.btnPrimaryTextColor};
          --palette-primary: ${theme.palette.length > 0 ? `rgb(${theme.palette[0].join(',')})` : 'var(--btn-primary-bg)'};
          --palette-secondary: ${theme.palette.length > 1 ? `rgb(${theme.palette[1].join(',')})` : 'var(--btn-secondary-bg)'};
          --palette-track: ${theme.accentColor ? `rgb(${theme.accentColor.join(',')})` : 'var(--sidebar-text)'};
		`
		: ''}
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

	<div class="sidebar-container">
		<div class="sidebar-content">
			{#if selectedWallpaper?.previewPath}
				<img
					src={selectedWallpaper.previewPath}
					alt="{selectedWallpaper.projectData?.title ||
						selectedWallpaper.folderName} preview"
					class="preview-image"
				/>
			{/if}

			<div class="actions-slot">
				<slot name="actions" />
			</div>

			<div class="content-slot">
				<slot />
			</div>
		</div>

		<div class="sidebar-footer">
			<button type="button" class="close-btn" on:click={onClose}
				>Close</button
			>
		</div>
	</div>
</div>

<style lang="scss">
	.sidebar-shell {
		/* Isolate from global Dynamic UI Theme */
		--btn-primary-bg: #007bff;
		--btn-primary-hover-bg: #53a6ff;
		--btn-secondary-bg: #2a2a2a;
		--btn-secondary-hover-bg: #464646;
		--text-color: rgba(255, 255, 255, 0.87);
		--text-inverse: rgba(0, 0, 0, 0.87);
		--text-muted: rgba(255, 255, 255, 0.4);
		--bg-surface: rgba(61, 61, 61, 0.4);
		--bg-surface-hover: rgba(255, 255, 255, 0.15);
		--bg-surface-active: rgba(255, 255, 255, 0.08);
		--bg-dropdown: #1e1e1e;
		--border-color: rgba(255, 255, 255, 0.15);
		--border-color-hover: rgba(255, 255, 255, 0.3);
		--top-bar-bg: rgba(0, 0, 0, 0.3);
		--sidebar-btn-text-final: rgba(255, 255, 255, 0.87);

		width: 0;
		min-width: 0;
		max-width: 0;
		background-color: var(--bg-dropdown);
		color: var(--text-color);
		box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
		transition: var(--transition-slow);
		border-radius: 15px;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		&.dynamic-theme {
			--btn-primary-bg: var(--palette-track);
			--btn-primary-hover-bg: var(--sidebar-text);
			--sidebar-btn-text-final: var(--btn-text-color);
			--btn-primary-text: var(--btn-text-color);
			--text-color: var(--sidebar-text);
			--text-muted: color-mix(
				in srgb,
				var(--sidebar-text),
				transparent 40%
			);
			--border-color: color-mix(
				in srgb,
				var(--sidebar-text),
				transparent 85%
			);
			--border-color-hover: color-mix(
				in srgb,
				var(--sidebar-text),
				transparent 70%
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

			background-color: var(--sidebar-bg);
			color: var(--text-color);
		}

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
				background-color: var(--btn-primary-bg);
				width: 7px;
				box-shadow: 2px 0 10px var(--btn-primary-bg);
			}
		}

		.sidebar-container {
			display: flex;
			flex-direction: column;
			height: 100%;
			width: 100%;
		}

		.sidebar-content {
			flex-grow: 1;
			overflow-y: auto;
			overflow-x: hidden;
			padding-bottom: 20px;
			text-align: left;
			border-radius: 15px;

			.preview-image {
				width: 100%;
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

		.close-btn {
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
				filter: brightness(1.2);
			}
		}

		&.open {
			min-width: 250px;
			max-width: 800px;
			flex-shrink: 0;
			padding: 5px 10px;
			margin-left: 20px;

			.sidebar-content {
				padding: 0 10px;
			}
		}

		/* Global Typography for any content inside the shell */
		:global(svg) {
			color: inherit !important;
			stroke: currentColor;
		}

		:global(img) {
			max-width: 100%;
			height: auto;
		}

		:global(p) {
			white-space: pre-wrap;
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
			color: var(--sidebar-text, var(--text-color));
		}

		:global(hr) {
			border: none;
			border-top: 1px solid
				color-mix(
					in srgb,
					var(--sidebar-text, var(--text-color)),
					transparent 70%
				);
			margin: 16px 0;
		}

		:global(a) {
			display: inline-block;
			background: color-mix(
				in srgb,
				var(--sidebar-text, var(--text-color)),
				transparent 80%
			);
			color: var(--sidebar-text, var(--text-color));
			padding: 8px 16px;
			border-radius: 6px;
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;

			&:hover {
				background: color-mix(
					in srgb,
					var(--sidebar-text, var(--text-color)),
					transparent 60%
				);
				transform: translateY(-2px);
			}
		}

		:global(input[type='range']) {
			background: var(
				--palette-track,
				var(--btn-primary-bg)
			) !important;

			&:hover {
				background: var(
					--palette-track,
					var(--btn-primary-hover-bg)
				) !important;
			}
		}
	}
</style>
