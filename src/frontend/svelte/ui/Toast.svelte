<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { backOut, cubicIn } from 'svelte/easing';
	import Icon from './Icon.svelte';
	import { removeToast } from '@/core/toastStore';

	export let id: string;
	export let message: string;
	export let type: 'success' | 'error' | 'warn' | 'info' = 'success';
	export let duration: number = 3000;

	const typeIcons = {
		success: 'check_circle',
		error: 'error',
		warn: 'warning',
		info: 'info'
	};

	const typeColors = {
		success: 'var(--success-bg)',
		error: 'var(--error-bg)',
		warn: 'var(--warn-bg)',
		info: 'var(--info-bg)'
	};

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const enter = reduceMotion ? fade : fly;
	const exit = reduceMotion ? fade : fly;
	const enterParams = reduceMotion ? { duration: 200 } : { x: 24, duration: 300, easing: backOut };
	const exitParams = reduceMotion ? { duration: 150 } : { x: 24, duration: 200, easing: cubicIn };

	const isAssertive = type === 'error' || type === 'warn';

	function handleCountdownEnd() {
		removeToast(id);
	}
</script>

<div
	class="toast-card"
	role={isAssertive ? 'alert' : 'status'}
	style="--type-color: {typeColors[type]}; --duration: {duration}ms"
	in:enter={enterParams}
	out:exit={exitParams}
>
	<div class="icon-chip">
		<Icon name={typeIcons[type]} size={18} />
	</div>

	<span class="message">{message}</span>

	<button class="close-btn" aria-label="Dismiss" on:click={() => removeToast(id)}>
		<Icon name="close" size={16} />
	</button>

	<div class="countdown" on:animationend={handleCountdownEnd}></div>
</div>

<style lang="scss">
	.toast-card {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 280px;
		max-width: 420px;
		padding: 12px 10px 14px 12px;
		background: var(--bg-overlay);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		pointer-events: auto;
		transition: border-color 0.2s ease;

		&:hover {
			border-color: rgba(255, 255, 255, 0.16);

			.countdown {
				animation-play-state: paused;
			}
		}

		.icon-chip {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			width: 28px;
			height: 28px;
			border-radius: 50%;
			color: var(--type-color);
			background: color-mix(in srgb, var(--type-color) 15%, transparent);
		}

		.message {
			flex-grow: 1;
			color: var(--text-color);
			font-weight: 500;
			font-size: 0.9em;
			line-height: 1.4;
		}

		.close-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			padding: 4px;
			background: transparent;
			border: none;
			border-radius: 4px;
			color: var(--text-muted);
			cursor: pointer;
			transition: color 0.2s ease, background 0.2s ease;

			&:hover {
				color: var(--text-color);
				background: rgba(255, 255, 255, 0.1);
			}

			&:focus-visible {
				outline: 2px solid var(--type-color);
				outline-offset: 2px;
			}
		}

		.countdown {
			position: absolute;
			left: 0;
			bottom: 0;
			width: 100%;
			height: 2px;
			background: var(--type-color);
			transform-origin: left;
			animation: drain var(--duration) linear forwards;
		}
	}

	@keyframes drain {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
</style>
