<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { applyNotice, type ApplyNotice } from '@/core/applyNotice';
	import Icon from './Icon.svelte';

	const EXPAND_DELAY_MS = 60;
	const COLLAPSE_AT_MS = 2000;
	const HIDE_AT_MS = 2400;

	const typeIcons = {
		success: 'check_circle',
		error: 'error'
	};

	const typeColors = {
		success: 'var(--success-bg)',
		error: 'var(--error-bg)'
	};

	let shown: ApplyNotice | null = null;
	let expanded = false;
	let timers: number[] = [];

	$: if ($applyNotice) showNotice($applyNotice);

	function clearTimers() {
		timers.forEach((timer) => clearTimeout(timer));
		timers = [];
	}

	function later(callback: () => void, delay: number) {
		timers.push(window.setTimeout(callback, delay));
	}

	function showNotice(notice: ApplyNotice) {
		clearTimers();
		shown = notice;
		expanded = false;
		later(() => (expanded = true), EXPAND_DELAY_MS);
		later(() => (expanded = false), COLLAPSE_AT_MS);
		later(() => (shown = null), HIDE_AT_MS);
	}

	onDestroy(clearTimers);
</script>

<div class="apply-notice-host">
	{#if shown}
		<div
			class="apply-notice"
			class:expanded
			style="--type-color: {typeColors[shown.type]}"
			role={shown.type === 'error' ? 'alert' : 'status'}
			in:fly={{ y: 16, duration: 300 }}
			out:fade={{ duration: 250 }}
		>
			<span class="icon">
				<Icon name={typeIcons[shown.type]} size={20} />
			</span>
			<span class="label">{shown.message}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	.apply-notice-host {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 28px;
		z-index: 2100;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.apply-notice {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		height: 44px;
		max-width: 44px;
		padding: 0 12px;
		border-radius: var(--radius-full);
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: var(--bg-overlay);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		color: var(--text-color);
		overflow: hidden;
		white-space: nowrap;
		transition: max-width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);

		&.expanded {
			max-width: 560px;

			.label {
				padding-left: 10px;
			}
		}

		.icon {
			display: inline-flex;
			flex-shrink: 0;
			color: var(--type-color);
		}

		.label {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: 0.9em;
			font-weight: 500;
			padding-left: 0;
			transition: padding-left 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.apply-notice,
		.apply-notice .label {
			transition: none;
		}
	}
</style>
