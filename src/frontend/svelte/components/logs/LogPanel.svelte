<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount, tick } from 'svelte';
	import { parseLogLine } from '@/utils/logColorizer';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import LogToolbar from './LogToolbar.svelte';
	import LogLine from './LogLine.svelte';

	interface Props {
		title: string;
		icon: string;
		type: 'backend' | 'frontend' | 'wallpaper';
		logs: string[];
		onClear: () => void;
		width: number;
		wrapText: boolean;
	}

	let { title, icon, type, logs, onClear, width, wrapText }: Props = $props();

	// Local states for this panel
	let searchQuery = $state('');
	let levelFilter = $state('all');
	let copied = $state(false);
	let autoScroll = $state(true);
	let logContainer = $state<HTMLDivElement>();

	// Derived parsed and filtered logs
	const parsedLogs = $derived(logs.map(parseLogLine));
	
	const filteredLogs = $derived(
		parsedLogs.filter(log => {
			if (levelFilter !== 'all' && log.level !== levelFilter) {
				return false;
			}
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return log.raw.toLowerCase().includes(query);
			}
			return true;
		})
	);

	// Scroll helpers
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

	function handleScroll() {
		if (logContainer) {
			autoScroll = isAtBottom(logContainer);
		}
	}

	function forceScrollToBottom() {
		autoScroll = true;
		if (logContainer) {
			scrollToBottom(logContainer);
		}
	}

	// Actions
	function copyLogs() {
		const text = filteredLogs.map(l => l.raw).join('\n');
		navigator.clipboard.writeText(text).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		});
	}

	function exportLogs() {
		const text = filteredLogs.map(l => l.raw).join('\n');
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `linux-wallpaperengine-gui-${type}-logs.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Scroll effect when new logs arrive
	$effect(() => {
		logs; // Depend on raw logs change
		if (autoScroll) {
			tick().then(() => {
				if (logContainer) scrollToBottom(logContainer);
			});
		}
	});

	onMount(async () => {
		await tick();
		if (logContainer) scrollToBottom(logContainer);
	});
</script>

<div class="log-panel" style="width: {width}%;">
	<div class="panel-header">
		<div class="panel-title-group">
			<Icon name={icon} size={16} />
			<span class="panel-title">{title}</span>
			<span class="panel-badge">{filteredLogs.length}</span>
		</div>
		<div class="panel-actions">
			<button class="icon-btn" onclick={copyLogs} title="Copy visible logs">
				<Icon name={copied ? "check" : "content_copy"} size={16} />
			</button>
			<button class="icon-btn" onclick={exportLogs} title="Export logs to file">
				<Icon name="download" size={16} />
			</button>
			<button class="icon-btn danger" onclick={onClear} title="Clear {title.toLowerCase()}">
				<Icon name="delete_sweep" size={16} />
			</button>
		</div>
	</div>
	
	<LogToolbar bind:searchQuery bind:levelFilter />

	<div
		class="log-box"
		class:empty={filteredLogs.length === 0}
		bind:this={logContainer}
		onscroll={handleScroll}
	>
		{#if filteredLogs.length === 0}
			<div class="empty-state">
				{#if type === 'frontend'}
					<Icon name="code_off" size={32} />
				{:else if type === 'backend'}
					<Icon name="dns_off" size={32} />
				{:else}
					<Icon name="wallpaper" size={32} style="opacity: 0.5;" />
				{/if}
				<span>No logs match filters.</span>
			</div>
		{:else}
			{#each filteredLogs as log, i}
				<LogLine {log} index={i} {searchQuery} {wrapText} />
			{/each}
		{/if}
	</div>

	{#if !autoScroll && filteredLogs.length > 0}
		<button 
			class="scroll-bottom-btn" 
			onclick={forceScrollToBottom}
			in:fade={{ duration: 150 }}
		>
			<Icon name="arrow_downward" size={14} />
			<span>Scroll to Bottom</span>
		</button>
	{/if}
</div>

<style lang="scss">
	.log-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 150px;
		overflow: hidden;
		position: relative;
		box-sizing: border-box;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 14px;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		flex-shrink: 0;
	}

	.panel-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-color);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.panel-badge {
		font-size: 0.75rem;
		padding: 1px 6px;
		border-radius: var(--radius-sm, 4px);
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-muted);
	}

	.panel-actions {
		display: flex;
		gap: 4px;
	}

	.icon-btn {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: var(--text-muted);
		padding: 6px;
		border-radius: var(--radius-md, 6px);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		
		&:hover {
			color: var(--text-color);
			background: rgba(255, 255, 255, 0.1);
			border-color: rgba(255, 255, 255, 0.15);
		}
		
		&.danger:hover {
			color: var(--error-color, #ff3131);
			background: var(--error-bg-translucent, rgba(239, 68, 68, 0.15));
			border-color: var(--error-border, rgba(220, 53, 69, 0.3));
		}
	}

	.log-box {
		flex: 1;
		padding: 12px 6px;
		overflow-y: auto;
		overflow-x: auto;
		box-sizing: border-box;
		
		&.empty {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.08);
			border-radius: var(--radius-full);
			&:hover {
				background: rgba(255, 255, 255, 0.18);
			}
		}
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

		span {
			font-size: 0.9em;
			font-weight: 500;
		}
	}

	.scroll-bottom-btn {
		position: absolute;
		bottom: 12px;
		right: 12px;
		background: var(--btn-primary-bg);
		color: var(--text-color);
		border: none;
		border-radius: var(--radius-md, 6px);
		padding: 6px 10px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
		transition: all 0.2s;
		z-index: 10;
		
		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2);
		}
	}
</style>
