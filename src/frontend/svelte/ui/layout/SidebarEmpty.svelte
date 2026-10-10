<script lang="ts">
	import { t } from '@/core/i18n';
	import Icon from '@/ui/Icon.svelte';
</script>

<div class="sidebar-empty">
	<Icon name="wallpaper" size={56} className="icon" />
	<h3 class="title">{$t('sidebar.empty.title')}</h3>
</div>

<style lang="scss">
	.sidebar-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 24px 12px;
		text-align: center;
		color: var(--text-muted);
	}

	:global(.sidebar-empty .icon) {
		animation: rise 0.6s ease-out both;
	}

	.title {
		margin: 0;
		font-size: 1.05em;
		font-weight: 600;
		color: var(--text-color, inherit);
		animation: rise 0.6s ease-out 0.1s both;
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
		.title,
		:global(.sidebar-empty .icon) {
			animation: none;
		}
	}

	:global(html.performance-mode) .sidebar-empty * {
		animation: none !important;
	}
</style>
