<script lang="ts">
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';

	export let searchError: string | null = null;
	export let onLaunchSteam: () => void;
	export let onRetry: () => void;
</script>

<div class="steam-fallback">
	<div class="fallback-content">
		<div class="fallback-icon">
			<Icon name="search" size={64} />
		</div>
		<h2>Steam is not running</h2>
		<p>
			The Workshop browser requires Steam to be running in the
			background to fetch wallpapers.
		</p>
		{#if searchError}
			<div class="error-notice">
				<p><strong>Error:</strong> {searchError}</p>
			</div>
		{/if}
		<div class="fallback-actions">
			<Button variant="primary" on:click={onLaunchSteam}>
				Launch Steam
			</Button>
			<Button variant="secondary" on:click={onRetry}>
				Retry Connection
			</Button>
		</div>
	</div>
</div>

<style lang="scss">
	.steam-fallback {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		text-align: center;
		background: var(--bg-surface);
		border-radius: 20px;
		margin-top: 10px;

		.fallback-content {
			max-width: 400px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20px;

			.fallback-icon {
				color: var(--text-muted);
				opacity: 0.5;
				margin-bottom: 8px;
			}

			h2 {
				margin: 0;
				font-size: 1.8rem;
				font-weight: 700;
				color: var(--text-color);
			}

			p {
				margin: 0;
				line-height: 1.6;
				color: var(--text-muted);
			}

			.error-notice {
				width: 100%;
				padding: 12px 16px;
				background: var(--error-bg-translucent);
				border: 1px solid var(--error-color);
				border-radius: var(--radius-md);
				text-align: left;
				font-size: 0.9rem;

				p {
					color: var(--error-color);
					margin: 0;
				}
			}

			.fallback-actions {
				display: flex;
				gap: 12px;
				margin-top: 12px;
			}
		}
	}
</style>
