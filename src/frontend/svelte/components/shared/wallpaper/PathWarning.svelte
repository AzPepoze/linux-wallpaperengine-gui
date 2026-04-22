<script lang="ts">
	import { fly } from 'svelte/transition';
	import { activeView } from '@/scripts/shared/ui';
	import Icon from '@/components/shared/ui/Icon.svelte';

	export let type: 'workshop' | 'assets' | 'we_config' = 'workshop';
	export let delay = 0;

	const config = {
		workshop: {
			title: 'Steam Workshop path not found',
			description:
				"The application couldn't find your Wallpaper Engine workshop content. Please check your Steam Search Paths in Settings.",
			action: 'Configure Search Paths',
			icon: 'warning'
		},
		assets: {
			title: 'Wallpaper Engine Assets not found',
			description:
				"Optional assets for some wallpapers (like effects or shaders) couldn't be auto-detected. Some wallpapers might not look right.",
			action: 'Fix Assets Path',
			icon: 'info'
		},
		we_config: {
			title: 'Wallpaper Engine Config not found',
			description:
				'Wallpaper Engine configuration not found. Please run Wallpaper Engine at least once to initialize it.',
			action: 'Open Steam',
			icon: 'warning'
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
		<Icon name={current.icon} size={48} />
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
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(8px);
		width: 100%;
		text-align: center;
		margin: 0 auto;

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
			text-align: center;

			h3 {
				margin: 0 0 12px;
				font-size: 1.5em;
				font-weight: 800;
				color: #ffffff;
			}

			p {
				margin: 0 0 20px;
				color: var(--text-muted);
				line-height: 1.8;
				font-size: 1.1em;
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
