<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { removeToast } from '@/core/toastStore';

	export let id: string;
	export let message: string;
	export let type: 'success' | 'error' | 'warn' | 'info' = 'success';
	export let duration: number = 3000;

	let remaining = duration;
	let isPaused = false;
	let lastTick = Date.now();
	
	$: progress = (remaining / duration) * 100;

	onMount(() => {
		const interval = setInterval(() => {
			if (isPaused) {
				lastTick = Date.now();
				return;
			}

			const now = Date.now();
			const delta = now - lastTick;
			lastTick = now;

			remaining -= delta;

			if (remaining <= 0) {
				clearInterval(interval);
				removeToast(id);
			}
		}, 10);
		
		return () => clearInterval(interval);
	});

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

	function handleMouseEnter() {
		isPaused = true;
	}

	function handleMouseLeave() {
		isPaused = false;
		lastTick = Date.now();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="toast-card"
	class:{type}
	in:fly={{ y: 20, duration: 400, easing: backOut }}
	out:scale={{ duration: 300, start: 0.9, easing: cubicOut, opacity: 0 }}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
>
	<div class="icon-wrap">
		<Icon name={typeIcons[type]} size={20} />
	</div>
	
	<div class="content">
		<span class="message">{message}</span>
	</div>

	<button class="close-btn" on:click={() => removeToast(id)}>
		<Icon name="close" size={16} />
	</button>

	<div class="progress-bar">
		<div 
			class="progress-fill" 
			style="width: {progress}%; background: {typeColors[type]}"
		></div>
	</div>
</div>

<style lang="scss">
	.toast-card {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 280px;
		max-width: 450px;
		padding: 14px 16px 14px 20px;
		background: rgba(30, 30, 30, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
		position: relative;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		pointer-events: auto;

		&:hover {
			transform: scale(1.02) translateX(-5px);
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
			border-color: rgba(255, 255, 255, 0.2);
		}

		&.success {
			border-left: 4px solid var(--success-bg);
			.icon-wrap { color: var(--success-bg); }
		}

		&.error {
			border-left: 4px solid var(--error-bg);
			.icon-wrap { color: var(--error-bg); }
		}

		&.warn {
			border-left: 4px solid var(--warn-bg);
			.icon-wrap { color: var(--warn-bg); }
		}

		&.info {
			border-left: 4px solid var(--info-bg);
			.icon-wrap { color: var(--info-bg); }
		}

		.icon-wrap {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.content {
			flex-grow: 1;
			
			.message {
				color: #fff;
				font-weight: 600;
				font-size: 0.95em;
				line-height: 1.4;
			}
		}

		.close-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.4);
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			transition: all 0.2s ease;
			margin-left: 4px;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.1);
			}
		}
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		z-index: 5;

		.progress-fill {
			height: 100%;
			border-top-right-radius: 2px;
		}
	}
</style>
