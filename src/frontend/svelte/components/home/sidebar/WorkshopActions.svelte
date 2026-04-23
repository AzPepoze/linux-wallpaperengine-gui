<script lang="ts">
	import {
		subscribe,
		unsubscribe,
		downloadProgress,
		subscribedIds,
		type ProgressInfo
	} from '@/scripts/workshop/workshop';
	import { logger } from '@/scripts/shared/logger';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import type { Wallpaper } from '@shared/types';

	export let wallpaper: Wallpaper;

	function getDownloadPercent(progress: ProgressInfo | undefined): number {
		if (!progress || progress.total === 0) return 0;
		return Math.round((Number(progress.current) / Number(progress.total)) * 100);
	}

	async function handleSubscribe() {
		try {
			await subscribe(wallpaper.folderName);
		} catch (e: any) {
			logger.error('Subscription failed:', e);
		}
	}

	async function handleUnsubscribe() {
		try {
			await unsubscribe(wallpaper.folderName);
		} catch (e: any) {
			logger.error('Unsubscription failed:', e);
		}
	}

	$: isSubscribed = $subscribedIds.has(wallpaper.folderName);
	$: progress = $downloadProgress[wallpaper.folderName];
	$: percent = getDownloadPercent(progress);
	$: isDownloading = !!progress;
</script>

<div class="workshop-actions">
	<button
		type="button"
		class="workshop-btn secondary-btn"
		on:click={() => {
			const url = `steam://url/CommunityFilePage/${wallpaper.folderName}`;
			window.electronAPI.openExternal(url);
		}}
	>
		<Icon name="storefront" size={18} />
		View on Workshop
	</button>

	{#if isSubscribed}
		{#if isDownloading}
			<button type="button" class="workshop-btn downloading">
				<div class="progress-cool" style="width: {percent}%">
					<div class="progress-glow"></div>
					<div class="progress-shimmer"></div>
				</div>
				<span class="progress-text">Downloading {percent}%</span>
			</button>
		{:else}
			<button
				type="button"
				class="workshop-btn unsubscribe-btn"
				on:click={handleUnsubscribe}
			>
				<Icon name="remove_shopping_cart" size={18} />
				Unsubscribe
			</button>
		{/if}
	{:else}
		<button
			type="button"
			class="workshop-btn"
			class:downloading={isDownloading}
			on:click={handleSubscribe}
		>
			{#if isDownloading}
				<div class="progress-cool" style="width: {percent}%">
					<div class="progress-glow"></div>
					<div class="progress-shimmer"></div>
				</div>
				<span class="progress-text">Downloading {percent}%</span>
			{:else}
				<Icon name="download" size={18} />
				Subscribe
			{/if}
		</button>
	{/if}
</div>

<style lang="scss">
	.workshop-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-block: 10px;
		width: 100%;

		.workshop-btn {
			background-color: var(--btn-primary-bg);
			border: none;
			font-size: 1em;
			font-weight: bold;
			cursor: pointer;
			color: var(--sidebar-btn-text-final);
			width: 100%;
			height: 40px;
			border-radius: 25px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 8px;
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;

			:global(*) {
				color: var(--sidebar-btn-text-final);
			}

			&:hover {
				filter: brightness(1.2);
			}

			&.downloading {
				background-color: var(--btn-secondary-bg);
				cursor: wait;
			}

			&.secondary-btn {
				background-color: color-mix(
					in srgb,
					var(--sidebar-text, white),
					transparent 92%
				);
				border: 1px solid
					color-mix(in srgb, var(--sidebar-text, white), transparent 80%);
				color: var(--sidebar-text, white);
				&:hover {
					background-color: color-mix(
						in srgb,
						var(--sidebar-text, white),
						transparent 85%
					);
					border-color: var(--btn-primary-bg);
				}

				:global(*) {
					color: var(--sidebar-text, white);
				}
			}

			.progress-cool {
				position: absolute;
				left: 0;
				top: 0;
				bottom: 0;
				background-color: var(--btn-primary-bg);
				transition: width 0.4s cubic-bezier(0.1, 0.7, 1, 0.1);
				z-index: 1;
				box-shadow: 2px 0 10px var(--btn-primary-bg);

				.progress-glow {
					position: absolute;
					right: -2px;
					top: 0;
					bottom: 0;
					width: 4px;
					background: white;
					box-shadow:
						0 0 15px white,
						0 0 5px white;
					opacity: 0.8;
				}

				.progress-shimmer {
					position: absolute;
					inset: 0;
					background: linear-gradient(
						90deg,
						transparent,
						rgba(255, 255, 255, 0.2),
						transparent
					);
					background-size: 200% 100%;
					animation: shimmer-anim 1.5s infinite linear;
				}
			}

			.progress-text {
				position: relative;
				z-index: 2;
				font-weight: 800;
				color: white !important;
				text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
			}

			:global(svg) {
				position: relative;
				z-index: 2;
			}
		}
	}

	@keyframes shimmer-anim {
		from {
			background-position: -200% 0;
		}
		to {
			background-position: 200% 0;
		}
	}
</style>
