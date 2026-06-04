<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@/ui/Icon.svelte';
	import ToggleButton from '@/ui/ToggleButton.svelte';
	import {
		backendLogs,
		frontendLogs,
		logger,
		wallpaperLogs
	} from '@/core/logger';
	import LogPanel from './LogPanel.svelte';
	import { t } from '@/core/i18n';

	// Visibility states (declared with Svelte 5 $state)
	let showBackend = $state(true);
	let showFrontend = $state(true);
	let showWallpaper = $state(true);
	let wrapText = $state(true);

	// Config list representing columns to make code DRY and fully reactive via Svelte 5 $derived
	const columns = $derived([
		{
			id: 'backend' as const,
			title: $t('logs.viewer.backgroundLogs'),
			icon: 'dns',
			logs: $backendLogs,
			visible: showBackend,
			toggle: () => (showBackend = !showBackend),
			onClear: () => backendLogs.set([])
		},
		{
			id: 'frontend' as const,
			title: $t('logs.viewer.uiLogs'),
			icon: 'terminal',
			logs: $frontendLogs,
			visible: showFrontend,
			toggle: () => (showFrontend = !showFrontend),
			onClear: () => frontendLogs.set([])
		},
		{
			id: 'wallpaper' as const,
			title: $t('logs.viewer.wallpaperLogs'),
			icon: 'wallpaper',
			logs: $wallpaperLogs,
			visible: showWallpaper,
			toggle: () => (showWallpaper = !showWallpaper),
			onClear: () => wallpaperLogs.set([])
		}
	]);

	// Resizable Columns State
	let containerElement = $state<HTMLDivElement>();
	let colWidths = $state<Record<string, number>>({
		backend: 33.33,
		frontend: 33.33,
		wallpaper: 33.33
	});

	// Derived visible column list
	let visibleCols = $derived(
		[
			showBackend && 'backend',
			showFrontend && 'frontend',
			showWallpaper && 'wallpaper'
		].filter(Boolean) as ('backend' | 'frontend' | 'wallpaper')[]
	);

	let lastVisibleColsStr = $state('');

	// Handle column visibility updates and redistribution of widths
	$effect(() => {
		const cols = visibleCols;
		const count = cols.length;
		
		if (count === 0) {
			lastVisibleColsStr = '';
			return;
		}

		const colsStr = cols.join(',');
		
		// If the visible columns changed, always redistribute evenly
		if (colsStr !== lastVisibleColsStr) {
			const share = 100 / count;
			for (const c of ['backend', 'frontend', 'wallpaper']) {
				if (cols.includes(c as any)) {
					colWidths[c] = share;
				} else {
					colWidths[c] = 0;
				}
			}
			lastVisibleColsStr = colsStr;
		}
	});

	function handleClearAll() {
		logger.clearAll();
	}

	function onWrapToggle(checked: boolean) {
		wrapText = checked;
		localStorage.setItem('log_viewer_wrap_text', checked.toString());
	}

	onMount(() => {
		const stored = localStorage.getItem('log_viewer_wrap_text');
		if (stored !== null) {
			wrapText = stored === 'true';
		}
	});

	// Resizing logic
	function startResize(e: MouseEvent, leftVisibleIdx: number) {
		e.preventDefault();
		if (!containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const containerWidth = containerRect.width;

		const leftColKey = visibleCols[leftVisibleIdx];
		const rightColKey = visibleCols[leftVisibleIdx + 1];

		const initialLeftPct = colWidths[leftColKey];
		const initialRightPct = colWidths[rightColKey];
		const startX = e.clientX;

		function onMouseMove(moveEvent: MouseEvent) {
			const deltaX = moveEvent.clientX - startX;
			const deltaPct = (deltaX / containerWidth) * 100;

			let newLeftPct = initialLeftPct + deltaPct;
			let newRightPct = initialRightPct - deltaPct;

			const minPct = 15;
			if (newLeftPct < minPct) {
				const diff = minPct - newLeftPct;
				newLeftPct = minPct;
				newRightPct -= diff;
			}
			if (newRightPct < minPct) {
				const diff = minPct - newRightPct;
				newRightPct = minPct;
				newLeftPct -= diff;
			}

			colWidths[leftColKey] = newLeftPct;
			colWidths[rightColKey] = newRightPct;
		}

		function onMouseUp() {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			document.body.classList.remove('is-resizing');
		}

		document.body.classList.add('is-resizing');
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}
</script>

<div class="logs-wrapper full">
	<div class="modal-header">
		<div class="header-left">
			<h2>{$t('logs.viewer.systemLogs')}</h2>
			<div class="tabs-switcher">
				{#each columns as col}
					<button
						class="tab-btn"
						class:active={col.visible}
						onclick={col.toggle}
						title="Toggle {col.title} column"
					>
						<Icon name={col.icon} size={16} />
						<span>{col.title}</span>
						<span class="badge">{col.logs.length}</span>
					</button>
				{/each}
			</div>
			<ToggleButton
				checked={wrapText}
				onChange={onWrapToggle}
				icon="wrap_text"
				label="Wrap Text"
				style="padding: 6px 14px; font-size: 0.85em; border-radius: var(--radius-md);"
			/>
		</div>
		<div class="header-actions">
			<button
				class="clear-btn danger"
				onclick={handleClearAll}
				title="Clear all logs"
			>
				<Icon name="delete" size={18} />
				<span>{$t('logs.viewer.clearAll')}</span>
			</button>
		</div>
	</div>

	<div class="logs-container">
		{#if visibleCols.length === 0}
			<div class="empty-state">
				<Icon name="view_week" size={48} />
				<h3>{$t('logs.viewer.allHidden')}</h3>
				<p>
					{$t('logs.viewer.allHiddenDesc')}
				</p>
			</div>
		{:else}
			<div class="logs-grid" bind:this={containerElement}>
				{#each visibleCols as colId, idx}
					{@const col = columns.find((c) => c.id === colId)!}
					<LogPanel
						title={col.title}
						icon={col.icon}
						type={col.id}
						logs={col.logs}
						onClear={col.onClear}
						width={colWidths[col.id]}
						{wrapText}
					/>

					{#if idx < visibleCols.length - 1}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="divider-handle"
							onmousedown={(e) => startResize(e, idx)}
						>
							<div class="divider-line"></div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.logs-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
		color: var(--text-color);

		&.full {
			flex-grow: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		flex-shrink: 0;
		gap: 20px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 24px;
		flex-wrap: wrap;

		h2 {
			margin: 0;
			font-size: 1.4em;
			font-weight: 700;
			color: var(--text-color);
		}
	}

	.tabs-switcher {
		display: flex;
		background: rgba(255, 255, 255, 0.03);
		padding: 4px;
		border-radius: var(--radius-lg);
		border: 1px solid rgba(255, 255, 255, 0.06);
		gap: 2px;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.85em;
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			color: var(--text-color);
			background: rgba(255, 255, 255, 0.04);
		}

		&.active {
			color: var(--text-color);
			background: var(--btn-primary-bg);
			box-shadow: 0 2px 8px rgba(var(--primary-raw-rgb), 0.3);
		}

		.badge {
			font-size: 0.8em;
			padding: 1px 6px;
			border-radius: var(--radius-full);
			background: rgba(255, 255, 255, 0.15);
			color: inherit;
		}
	}

	.header-actions {
		display: flex;
		gap: 10px;
		align-items: center;

		button {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 6px 14px;
			font-size: 0.85em;
			font-weight: 600;
			cursor: pointer;
			background-color: var(--btn-secondary-bg);
			border: 1px solid var(--border-color);
			color: var(--text-color);
			border-radius: var(--radius-md);
			transition: all 0.2s ease;

			&:hover {
				background-color: var(--btn-secondary-hover-bg);
				border-color: var(--border-color-hover);
			}

			&.danger {
				background-color: var(
					--error-bg-translucent,
					rgba(220, 53, 69, 0.1)
				);
				border-color: var(--error-border, rgba(220, 53, 69, 0.2));
				color: var(--error-color, #ff3131);

				&:hover {
					background-color: color-mix(
						in srgb,
						var(--error-bg, #dc3545),
						transparent 80%
					);
					border-color: var(
						--error-border,
						rgba(220, 53, 69, 0.4)
					);
					color: var(--text-color);
				}
			}


		}
	}

	.logs-container {
		flex: 1;
		min-height: 0;
		background-color: color-mix(
			in srgb,
			var(--bg-app),
			black 30%
		); /* Deep dark terminal background */
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.logs-grid {
		display: flex;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.divider-handle {
		width: 8px;
		margin: 0 -4px;
		cursor: col-resize;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		position: relative;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(255, 255, 255, 0.05);
			.divider-line {
				background-color: var(--btn-primary-bg);
				box-shadow: 0 0 8px var(--btn-primary-bg);
			}
		}
	}

	.divider-line {
		width: 2px;
		height: 100%;
		background-color: rgba(255, 255, 255, 0.08);
		transition:
			background-color 0.2s,
			box-shadow 0.2s;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 12px;
		color: var(--text-muted);
		opacity: 0.5;
		user-select: none;
		text-align: center;
		padding: 20px;

		h3 {
			margin: 0;
			font-size: 1.1em;
			font-weight: 600;
			color: var(--text-color);
		}

		p {
			margin: 0;
			font-size: 0.85em;
			max-width: 250px;
		}
	}

	:global(body.is-resizing),
	:global(body.is-resizing) * {
		cursor: col-resize !important;
		user-select: none !important;
	}
</style>
