<script lang="ts">
	import { fly } from 'svelte/transition';
	import { activeView } from '../../scripts/ui';

	export let type: 'workshop' | 'assets' = 'workshop';
	export let delay = 0;

	const config = {
		workshop: {
			title: 'Steam Workshop path not found',
			description:
				"The application couldn't find your Wallpaper Engine workshop content. Please check your Steam Search Paths in Settings.",
			action: 'Configure Search Paths',
			icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
		},
		assets: {
			title: 'Wallpaper Engine Assets not found',
			description:
				"Optional assets for some wallpapers (like effects or shaders) couldn't be auto-detected. Some wallpapers might not look right.",
			action: 'Fix Assets Path',
			icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'
		}
	};

	const current = config[type];
</script>

<div
	class="priority-warning"
	class:assets-warning={type === 'assets'}
	in:fly={{ y: -20, duration: 400, delay }}
>
	<div class="warning-icon">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			{#if type === 'workshop'}
				<path d={current.icon}></path>
				<line x1="12" y1="9" x2="12" y2="13"></line>
				<line x1="12" y1="17" x2="12.01" y2="17"></line>
			{:else}
				<path d={current.icon}></path>
			{/if}
		</svg>
	</div>
	<div class="warning-content">
		<h3>{current.title}</h3>
		<p>{current.description}</p>
		<button
			class="warning-action"
			on:click={() => activeView.set('settings')}
		>
			{current.action}
		</button>
	</div>
</div>

<style lang="scss">
	.priority-warning {
		padding: 30px;
		background: rgba(220, 53, 69, 0.1);
		border: 1px solid rgba(220, 53, 69, 0.3);
		border-radius: var(--radius-lg);
		display: flex;
		gap: 20px;
		align-items: flex-start;
		backdrop-filter: blur(8px);
		max-width: 800px;
		width: 100%;
		text-align: left;

		&.assets-warning {
			background: rgba(255, 193, 7, 0.05);
			border-color: rgba(255, 193, 7, 0.2);
			.warning-icon {
				color: #ffc107;
			}
			.warning-action {
				background: #ffc107;
				color: #000;
				&:hover {
					background: #e0ac06;
				}
			}
		}

		.warning-icon {
			color: #ff4d4d;
			padding-top: 5px;
		}

		.warning-content {
			flex: 1;

			h3 {
				margin: 0 0 8px;
				font-size: 1.25em;
				font-weight: 700;
			}

			p {
				margin: 0 0 20px;
				color: var(--text-muted);
				line-height: 1.5;
				max-width: 600px;
			}

			.warning-action {
				padding: 10px 24px;
				background: #ff4d4d;
				color: white;
				border: none;
				border-radius: var(--radius-md);
				font-weight: 700;
				cursor: pointer;
				transition: var(--transition-base);

				&:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 12px rgba(255, 77, 77, 0.3);
				}
			}
		}
	}
</style>
