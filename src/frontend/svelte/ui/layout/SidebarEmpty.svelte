<script lang="ts">
	import { t } from '@/core/i18n';
	import { settingsStore } from '@/features/settings/scripts/settings';

	$: showDoubleClick = !!$settingsStore?.doubleClickApply;
</script>

<div class="sidebar-empty">
	<div class="screen" aria-hidden="true">
		<span class="layer"></span>
		<span class="layer"></span>
		<span class="layer"></span>
	</div>

	<h3 class="title">{$t('sidebar.empty.title')}</h3>
	<p class="hint">{$t('sidebar.empty.hint')}</p>

	<ul class="tips">
		<li>
			<span class="chip">{$t('sidebar.empty.click')}</span>
			<span>{$t('sidebar.empty.clickDesc')}</span>
		</li>
		{#if showDoubleClick}
			<li>
				<span class="chip">{$t('sidebar.empty.doubleClick')}</span>
				<span>{$t('sidebar.empty.doubleClickDesc')}</span>
			</li>
		{/if}
		<li>
			<span class="chip">{$t('sidebar.empty.rightClick')}</span>
			<span>{$t('sidebar.empty.rightClickDesc')}</span>
		</li>
	</ul>
</div>

<style lang="scss">
	.sidebar-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		padding: 24px 12px;
		text-align: center;
	}

	.screen {
		position: relative;
		width: 180px;
		aspect-ratio: 16 / 10;
		border: 2px solid var(--border-color-hover);
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 8px;
		animation: rise 0.6s ease-out both;

		/* Monitor stand */
		&::after {
			content: '';
			position: absolute;
			left: 50%;
			bottom: -14px;
			width: 40px;
			height: 6px;
			transform: translateX(-50%);
			border-radius: 3px;
			background: var(--border-color-hover);
		}
	}

	.layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		animation: crossfade 12s ease-in-out infinite;

		&:nth-child(1) {
			background: linear-gradient(135deg, #0f766e, #5eead4);
			opacity: 1;
		}

		&:nth-child(2) {
			background: linear-gradient(135deg, #3730a3, #fb7185);
			animation-delay: -4s;
		}

		&:nth-child(3) {
			background: linear-gradient(135deg, #1e3a5f, #f59e0b);
			animation-delay: -8s;
		}
	}

	.title {
		margin: 0;
		font-size: 1.05em;
		font-weight: 600;
		animation: rise 0.6s ease-out 0.1s both;
	}

	.hint {
		margin: 0;
		max-width: 240px;
		font-size: 0.9em;
		color: var(--text-muted);
		animation: rise 0.6s ease-out 0.2s both;
	}

	.tips {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		margin: 12px 0 0;
		padding: 0;
		list-style: none;
		animation: rise 0.6s ease-out 0.3s both;

		li {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.85em;
		}
	}

	.chip {
		min-width: 7.5em;
		padding: 3px 10px;
		border: 1px solid var(--border-color-hover);
		border-radius: 999px;
		text-align: center;
		white-space: nowrap;
	}

	@keyframes crossfade {
		0%,
		30% {
			opacity: 1;
		}
		40%,
		100% {
			opacity: 0;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.screen,
		.title,
		.hint,
		.tips,
		.layer {
			animation: none;
		}

		.layer:not(:nth-child(1)) {
			opacity: 0;
		}
	}

	:global(html.performance-mode) .sidebar-empty * {
		animation: none !important;
	}
</style>
