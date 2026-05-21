<script lang="ts">
	import { highlightText, colorizeMessage, type ParsedLog } from '@/utils/logColorizer';

	interface Props {
		log: ParsedLog;
		index: number;
		searchQuery: string;
	}

	let { log, index, searchQuery }: Props = $props();
</script>

<div class="log-line {log.level}">
	<span class="line-no">{index + 1}</span>
	<!-- svelte-ignore a11y_missing_attribute -->
	<span class="log-time" title={log.dateOnly}>{log.timeOnly || 'N/A'}</span>
	{#if log.prefix}
		<span class="log-prefix prefix-{log.prefix.toLowerCase()}">{log.prefix}</span>
	{:else}
		<span class="log-prefix-placeholder"></span>
	{/if}
	<span class="line-content">{@html highlightText(colorizeMessage(log.message), searchQuery)}</span>
</div>

<style lang="scss">
	.log-line {
		display: flex;
		padding: 2px 8px;
		border-left: 3px solid transparent;
		transition: background-color 0.1s ease;
		font-family: 'JetBrains Mono', 'Fira Code', 'Fira Mono', Consolas, Monaco, monospace;
		font-size: 0.75rem;
		line-height: 1.5;

		&:hover {
			background-color: rgba(255, 255, 255, 0.02);
		}

		&.error {
			border-left-color: var(--error-bg, #dc3545);
			background-color: var(--error-bg-translucent, rgba(220, 53, 69, 0.1));
			
			&:hover {
				background-color: color-mix(in srgb, var(--error-bg, #dc3545), transparent 80%);
			}
			
			.line-content {
				color: var(--error-color, #ff3131);
			}
		}

		&.warning {
			border-left-color: var(--warn-bg, #ffc107);
			background-color: color-mix(in srgb, var(--warn-bg, #ffc107), transparent 96%);
			
			&:hover {
				background-color: color-mix(in srgb, var(--warn-bg, #ffc107), transparent 90%);
			}
			
			.line-content {
				color: color-mix(in srgb, var(--warn-bg, #ffc107), white 20%);
			}
		}

		&.success {
			border-left-color: var(--success-bg, #28a745);
			
			.line-content {
				color: color-mix(in srgb, var(--success-bg, #28a745), white 30%);
			}
		}

		&.info {
			border-left-color: rgba(255, 255, 255, 0.1);
		}
	}

	.line-no {
		flex-shrink: 0;
		width: 32px;
		color: rgba(255, 255, 255, 0.5);
		text-align: right;
		user-select: none;
		padding-right: 8px;
		margin-right: 8px;
		border-right: 1px solid rgba(255, 255, 255, 0.15);
	}

	.log-time {
		flex-shrink: 0;
		width: 60px;
		color: rgba(255, 255, 255, 0.7);
		margin-right: 8px;
		user-select: none;
		display: inline-block;
	}

	.log-prefix {
		flex-shrink: 0;
		font-size: 0.7rem;
		padding: 0px 6px;
		border-radius: 3px;
		margin-right: 8px;
		font-weight: bold;
		user-select: none;
		width: 76px;
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
		box-sizing: border-box;
		
		&.prefix-backend {
			background: var(--success-bg-translucent, rgba(40, 167, 69, 0.25));
			color: color-mix(in srgb, var(--success-bg, #28a745), white 40%);
		}
		&.prefix-electron {
			background: var(--bg-primary-translucent, rgba(0, 123, 255, 0.2));
			color: #72b6ff;
		}
		&.prefix-wallpaper {
			background: rgba(23, 162, 184, 0.2);
			color: #33b5e5;
		}
		&.prefix-frontend {
			background: var(--playlist-highlight, rgba(181, 102, 255, 0.25));
			color: #c58cff;
		}
	}

	.log-prefix-placeholder {
		flex-shrink: 0;
		width: 76px;
		margin-right: 8px;
		display: inline-block;
	}

	.line-content {
		flex: 1;
		white-space: pre-wrap;
		word-break: break-all;
		color: var(--text-color);
		text-align: left;

		:global(.status-error) {
			color: var(--error-color, #ff3131);
			font-weight: bold;
		}
		:global(.status-warning) {
			color: color-mix(in srgb, var(--warn-bg, #ffc107), white 20%);
			font-weight: bold;
		}
		:global(.status-success) {
			color: color-mix(in srgb, var(--success-bg, #28a745), white 30%);
			font-weight: bold;
		}
		:global(.log-highlight) {
			background-color: rgba(255, 235, 59, 0.3);
			color: #ffffff;
			border-radius: 2px;
			padding: 0 2px;
		}
	}
</style>
