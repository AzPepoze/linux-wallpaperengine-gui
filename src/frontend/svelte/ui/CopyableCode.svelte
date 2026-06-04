<script lang="ts">
	import Icon from './Icon.svelte';
	import { showToast } from '@/core/toastStore';
	import { t } from '@/core/i18n';

	export let code: string;

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(code);
			showToast($t('ui.copiedToClipboard'), 'success');
		} catch (err) {
			console.error('Failed to copy text: ', err);
			showToast($t('ui.failedToCopyText'), 'error');
		}
	}
</script>

<div class="copyable">
	<code>{code}</code>
	<button class="copy-btn" on:click={copyToClipboard} title={$t('ui.copy')}>
		<Icon name="content_copy" size={14} />
	</button>
</div>

<style lang="scss">
	.copyable {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	code {
		background: var(--bg-app);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-family: monospace;
		color: var(--text-color);
	}

	.copy-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		padding: 4px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: var(--transition-base);

		&:hover {
			color: var(--text-color);
			background: var(--bg-surface-hover);
		}
	}
</style>
