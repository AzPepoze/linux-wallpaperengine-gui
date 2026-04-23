<script lang="ts">
	import { fade, scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import { subscribe } from '@/scripts/workshop/workshop';

	export let folderName: string;
	export let isWorkshopItem: boolean = false;
	export let isSubscribed: boolean = false;
	export let isDownloaded: boolean = false;
	export let isDownloading: boolean = false;
	export let percent: number = 0;
	export let approved: boolean = false;
	export let layout: 'grid' | 'list' = 'grid';

	async function handleSubscribe() {
		try {
			await subscribe(folderName);
		} catch (e) {}
	}
</script>

{#if approved}
	<div class="approved-badge" class:list-layout={layout === 'list'} title="Approved Wallpaper">
		<Icon name="emoji_events" size={layout === 'list' ? 14 : 18} />
	</div>
{/if}

{#if isWorkshopItem && isDownloaded && isSubscribed}
	<div
		class="downloaded-badge"
		class:list-layout={layout === 'list'}
		title="Downloaded"
		in:scale={{ start: 0.8, duration: 300, easing: backOut }}
		out:scale={{ start: 0.5, duration: 200 }}
	>
		<Icon name="check" size={layout === 'list' ? 14 : 16} strokeWidth={3} />
	</div>
{/if}

{#if isWorkshopItem && isDownloading && !isDownloaded}
	<div
		class="progress-overlay-container"
		class:list-layout={layout === 'list'}
		in:fade={{ duration: 300 }}
		out:fade={{ duration: 300 }}
	>
		<div class="progress-wave-bg" style="height: {percent}%"></div>
		<div
			class="center-pct"
			in:scale={{
				start: 0.8,
				duration: 400,
				delay: 100,
				easing: backOut
			}}
			out:fade={{ duration: 300 }}
		>
			{#if percent === 0}
				<div in:scale>
					<Icon name="hourglass_empty" size={layout === 'list' ? 20 : 32} />
				</div>
			{:else}
				<span class="pct">{percent}%</span>
			{/if}
			<span class="label">{percent === 0 ? 'Queued' : 'Downloading'}</span>
		</div>
		<div class="progress-mask"></div>
	</div>
{/if}

{#if isWorkshopItem && !isSubscribed && !isDownloading}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="download-badge"
		class:list-layout={layout === 'list'}
		title="Download"
		on:click|stopPropagation={handleSubscribe}
		in:fly={{ y: 8, duration: 300, easing: backOut }}
	>
		<Icon name="download" size={layout === 'list' ? 20 : 18} />
	</div>
{/if}

<style lang="scss">
	.approved-badge {
		position: absolute;
		top: 5px;
		left: 5px;
		z-index: 5;
		padding: 4px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))
			drop-shadow(0 0 2px rgba(141, 255, 112, 0.8));

		&.list-layout {
			position: static;
			padding: 0;
			filter: none;
			color: var(--playlist-highlight-border);
		}
	}

	.downloaded-badge {
		position: absolute;
		top: 5px;
		right: 5px;
		z-index: 6;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #4caf50;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		border: 2px solid white;

		&.list-layout {
			width: 22px;
			height: 22px;
			top: 4px;
			right: 4px;
			border-width: 1.5px;
		}
	}

	.progress-overlay-container {
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: none;
		border-radius: inherit;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;

		.progress-wave-bg {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			background: var(--download-progress);
			opacity: 0.8;
			transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
			z-index: 1;

			&::before {
				content: '';
				position: absolute;
				top: -19px;
				left: 0;
				width: 200%;
				height: 20px;
				background: var(--download-progress);
				mask-size: 100% 100%;
				-webkit-mask-size: 100% 100%;
				mask-repeat: repeat-x;
				-webkit-mask-repeat: repeat-x;
				mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z'/%3E%3C/svg%3E");
				-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z'/%3E%3C/svg%3E");
				animation: wave-anim 3s linear infinite;
			}
		}

		.center-pct {
			position: relative;
			z-index: 4;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			color: white;
			filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
			text-shadow:
				0 2px 10px rgba(0, 0, 0, 0.8),
				0 0 4px rgba(0, 0, 0, 0.5);

			.pct {
				font-size: 2rem;
				font-weight: 900;
				line-height: 1;
			}

			.label {
				font-size: 1rem;
				text-transform: uppercase;
				letter-spacing: 1px;
				font-weight: 700;
				opacity: 0.9;
			}
		}

		&.list-layout {
			.center-pct {
				gap: 2px;
				.pct {
					font-size: 1.5rem;
				}
				.label {
					font-size: 0.8rem;
				}
			}
		}

		.progress-mask {
			position: absolute;
			inset: 0;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
			z-index: 2;
		}
	}

	.download-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 10;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--badge-bg);
		color: var(--text-color);
		transition: all 0.2s;
		pointer-events: auto;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);

		&:hover {
			background: var(--btn-primary-bg);
			transform: scale(1.1);
		}

		&.list-layout {
			position: static;
			background: var(--badge-bg);
			border-radius: 8px;
			width: 36px;
			height: 36px;
			box-shadow: none;
			border: none;
		}
	}

	@keyframes wave-anim {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
