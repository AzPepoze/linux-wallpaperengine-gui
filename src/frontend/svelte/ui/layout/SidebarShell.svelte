<script lang="ts">
	import { sidebarHidden, sidebarWidth } from '@/core/ui';
	import {
		calculateSidebarTheme,
		DEFAULT_THEME,
		type SidebarTheme
	} from '@/features/home/scripts/sidebarTheme';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import CloseIcon from '@/ui/icons/CloseIcon.svelte';
	import SidebarEmpty from '@/ui/layout/SidebarEmpty.svelte';
	import ResizeHandle from '@/ui/ResizeHandle.svelte';
	import type { Wallpaper } from '@shared/types';

	export let selectedWallpaper: Wallpaper | null = null;
	export let onClose: () => void = () => {};

	let theme: SidebarTheme = DEFAULT_THEME;
	let isResizing = false;

	$: selectedFolderName = selectedWallpaper?.folderName;
	$: isOpen = !$sidebarHidden;

	// Picking a different wallpaper shows the sidebar again
	$: selectedFolderName, sidebarHidden.set(false);

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
</script>

<div
	class="sidebar-shell"
	class:open={isOpen}
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
		width: {isOpen ? $sidebarWidth + 'px' : '0'};
	"
>
	{#if isOpen}
		<ResizeHandle
			bind:isResizing
			position="left"
			minWidth={250}
			maxWidth={800}
			width={$sidebarWidth}
			onResize={(w) => sidebarWidth.set(w)}
			calculateWidth={(clientX) => window.innerWidth - clientX - 40}
			style="--border-color: var(--btn-secondary-bg); z-index: 10;"
		/>
	{/if}

	<div class="sidebar-container">
		<div class="sidebar-content" class:is-empty={!selectedWallpaper}>
			{#if selectedWallpaper}
				{#if selectedWallpaper.previewPath}
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
			{:else}
				<SidebarEmpty />
			{/if}
		</div>

		{#if selectedWallpaper}
			<div class="sidebar-footer">
				<slot name="footer" />
			</div>

			<button
				type="button"
				class="close-btn"
				aria-label="Close sidebar"
				on:click={onClose}
			>
				<CloseIcon width="18" height="18" />
			</button>
		{/if}
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

		&.open {
			min-width: 250px;
			max-width: 800px;
			flex-shrink: 0;
			padding: 5px 10px;
			margin-left: 20px;
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
			padding: 0 10px;

			.preview-image {
				width: 100%;
				aspect-ratio: 1 / 1;
				border-radius: 20px;
				margin: 20px auto 15px auto;
				display: block;
				object-fit: cover;
			}
		}

		.close-btn {
			position: absolute;
			top: 12px;
			right: 12px;
			z-index: 6;
			width: 32px;
			height: 32px;
			padding: 0;
			border: none;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: var(--top-bar-bg);
			color: var(--text-color);
			cursor: pointer;
			transition: background-color 0.2s ease;

			&:hover {
				background-color: var(--bg-surface-hover);
			}
		}

		.sidebar-footer {
			padding: 10px 0;
			flex-shrink: 0;
		}

		.sidebar-content.is-empty {
			display: flex;
			flex-direction: column;
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
	}
</style>
