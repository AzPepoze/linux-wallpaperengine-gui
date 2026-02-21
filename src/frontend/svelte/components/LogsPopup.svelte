<script lang="ts">
	import {
		frontendLogs,
		backendLogs,
		wallpaperLogs,
		logger
	} from '../scripts/logger';
	import { onMount, tick } from 'svelte';

	let frontendLogContainer: HTMLDivElement;
	let backendLogContainer: HTMLDivElement;
	let wallpaperLogContainer: HTMLDivElement;

	let frontendAutoScroll = true;
	let backendAutoScroll = true;
	let wallpaperAutoScroll = true;

	function isAtBottom(element: HTMLDivElement) {
		if (!element) return false;
		const threshold = 50;
		return (
			element.scrollHeight -
				element.scrollTop -
				element.clientHeight <=
			threshold
		);
	}

	function scrollToBottom(element: HTMLDivElement) {
		if (element) {
			element.scrollTop = element.scrollHeight;
		}
	}

	function handleFrontendScroll() {
		if (frontendLogContainer) {
			frontendAutoScroll = isAtBottom(frontendLogContainer);
		}
	}

	function handleBackendScroll() {
		if (backendLogContainer) {
			backendAutoScroll = isAtBottom(backendLogContainer);
		}
	}

	function handleWallpaperScroll() {
		if (wallpaperLogContainer) {
			wallpaperAutoScroll = isAtBottom(wallpaperLogContainer);
		}
	}

	// Initial scroll to bottom
	onMount(async () => {
		await tick();
		scrollToBottom(frontendLogContainer);
		scrollToBottom(backendLogContainer);
		scrollToBottom(wallpaperLogContainer);
	});

	$effect(() => {
		// We reference the logs to make the effect reactive to them
		$frontendLogs;
		$backendLogs;
		$wallpaperLogs;

		if (frontendAutoScroll) scrollToBottom(frontendLogContainer);
		if (backendAutoScroll) scrollToBottom(backendLogContainer);
		if (wallpaperAutoScroll) scrollToBottom(wallpaperLogContainer);
	});
</script>

<div class="logs-wrapper full">
	<div class="modal-header">
		<h2>System Logs</h2>
		<div class="header-actions">
			<button class="clear-btn" onclick={() => logger.clearAll()}
				>Clear Logs</button
			>
		</div>
	</div>
	<div class="logs-container">
		<div class="log-section">
			<h3>UI Logs</h3>
			<div
				class="log-box"
				bind:this={frontendLogContainer}
				onscroll={handleFrontendScroll}
			>
				{#each $frontendLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
			</div>
		</div>
		<div class="log-section">
			<h3>Background Logs</h3>
			<div
				class="log-box"
				bind:this={backendLogContainer}
				onscroll={handleBackendScroll}
			>
				{#each $backendLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
			</div>
		</div>
		<div class="log-section">
			<h3>Wallpaper Logs</h3>
			<div
				class="log-box"
				bind:this={wallpaperLogContainer}
				onscroll={handleWallpaperScroll}
			>
				{#each $wallpaperLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.logs-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 20px;
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
		margin-bottom: 20px;
		flex-shrink: 0;

		h2 {
			margin: 0;
			color: var(--text-color);
		}
	}

	.header-actions {
		display: flex;
		gap: 10px;
		align-items: center;

		button {
			padding: 5px 10px;
			cursor: pointer;
			background-color: var(--btn-secondary-bg);
			border: 1px solid var(--border-color);
			color: var(--text-color);
			border-radius: var(--radius-sm);
			transition: var(--transition-base);

			&:hover {
				background-color: var(--btn-secondary-hover-bg);
			}
		}
	}

	.logs-container {
		display: flex;
		gap: 20px;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.log-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;

		h3 {
			color: var(--text-color);
			opacity: 0.8;
			margin-top: 0;
			margin-bottom: 10px;
			flex-shrink: 0;
		}
	}

	.log-box {
		flex: 1;
		background-color: var(--bg-dropdown);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 10px;
		overflow: auto;
		font-family: monospace;
		font-size: 0.9em;
		color: var(--text-muted);
		white-space: pre;
		text-align: left;
	}

	.log-entry {
		margin-bottom: 4px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		padding-bottom: 2px;
	}
</style>
