<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut, quintIn } from 'svelte/easing';

	export let message: string;
	export let type: 'success' | 'error' | 'warn' | 'info' = 'success';
</script>

<div
	class="toast"
	class:success={type === 'success'}
	class:error={type === 'error'}
	class:warn={type === 'warn'}
	class:info={type === 'info'}
	in:fly={{ y: 30, duration: 400, easing: quintOut }}
	out:fly={{ y: 20, duration: 300, easing: quintIn, opacity: 0 }}
>
	{message}
</div>

<style lang="scss">
	.toast {
		position: fixed;
		bottom: 32px;
		right: 32px;
		padding: 14px 28px;
		border-radius: var(--radius-lg);
		font-weight: 600;
		font-size: 0.95em;
		z-index: 1000;
		box-shadow: var(--shadow-md);
		transition: var(--transition-base);

		&:hover {
			transform: translateY(-2px);
		}

		&.success {
			background: var(--success-bg);
			color: var(--success-color);
			border: 1px solid var(--success-border);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		}

		&.error {
			background: var(--error-bg);
			color: var(--error-color);
			border: 1px solid var(--error-border);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		}

		&.warn {
			background: var(--warn-bg);
			color: var(--warn-color);
			border: 1px solid var(--warn-border);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		}

		&.info {
			background: var(--info-bg);
			color: var(--info-color);
			border: 1px solid var(--info-border);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		}
	}
</style>
