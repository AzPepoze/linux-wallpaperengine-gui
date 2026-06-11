<script lang="ts">
	import Icon from '@/ui/Icon.svelte';
	import GithubIcon from '@/ui/icons/GithubIcon.svelte';
	import { onMount } from 'svelte';

	let version = '...';
	let logoUrl = 'icon.png';

	onMount(async () => {
		version = await window.electronAPI.getVersion();
	});

	async function handleLogoError() {
		try {
			const data = await window.electronAPI.readBinaryFile('icon.png');
			if (data) {
				const base64 = btoa(
					new Uint8Array(data).reduce(
						(data, byte) => data + String.fromCharCode(byte),
						''
					)
				);
				logoUrl = `data:image/png;base64,${base64}`;
			}
		} catch (e) {
			console.error('Failed to load logo fallback:', e);
		}
	}

	const links = [
		{
			label: 'GitHub Repository',
			url: 'https://github.com/AzPepoze/linux-wallpaperengine-gui',
			icon: 'github'
		},
		{
			label: 'Report an Issue',
			url: 'https://github.com/AzPepoze/linux-wallpaperengine-gui/issues',
			icon: 'bug_report'
		},
		{
			label: 'linux-wallpaperengine',
			url: 'https://github.com/Almamu/linux-wallpaperengine',
			icon: 'terminal'
		},
		{
			label: 'Check Release',
			url: 'https://github.com/AzPepoze/linux-wallpaperengine-gui/releases',
			icon: 'update'
		}
	];

	function openLink(url: string) {
		window.electronAPI.openExternal(url);
	}
</script>

<div class="about-container">
	<div class="app-info-card">
		<div class="app-logo">
			<img
				src={logoUrl}
				alt="App Logo"
				on:error={handleLogoError}
			/>
		</div>
		<div class="app-details">
			<h3>Linux Wallpaper Engine GUI</h3>
			<div class="version-badge">
				<span>v{version}</span>
			</div>
			<p class="description">
				A graphical user interface for managing wallpapers for
				<br />
				<a href="https://github.com/Almamu/linux-wallpaperengine">
					linux-wallpaperengine
				</a>
			</p>
		</div>
	</div>

	<div class="about-grid">
		<div class="about-section">
			<h4>Links</h4>
			<div class="links-grid">
				{#each links as link}
					<button
						class="link-item"
						on:click={() => openLink(link.url)}
					>
						<div class="link-icon">
							{#if link.icon === 'github'}
								<div class="svg-icon">
									<GithubIcon />
								</div>
							{:else}
								<Icon name={link.icon} size={20} />
							{/if}
						</div>
						<div class="link-label">
							<span>{link.label}</span>
							<Icon
								name="chevron_right"
								size={14}
								style="margin-left: auto; opacity: 0.3;"
							/>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="about-footer">
		<p>Built with Svelte, Electron, and Go.</p>
		<p class="credits">
			This project is a GUI wrapper for <strong
				>linux-wallpaperengine</strong
			> by Almamu.
		</p>
		<p class="license">Licensed under GNU General Public License v3.0</p>
	</div>
</div>

<style lang="scss">
	.about-container {
		display: flex;
		flex-direction: column;
		gap: 32px;
		width: 100%;
	}

	.app-info-card {
		display: flex;
		align-items: center;
		gap: 32px;
		padding: 40px;
		background: linear-gradient(
			135deg,
			rgba(var(--primary-raw-rgb), 0.1) 0%,
			rgba(var(--primary-raw-rgb), 0.02) 100%
		);
		border-radius: var(--radius-xl);
		border: none;
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: -50%;
			left: -50%;
			width: 200%;
			height: 200%;
			background: radial-gradient(
				circle at center,
				rgba(var(--primary-raw-rgb), 0.05) 0%,
				transparent 50%
			);
			pointer-events: none;
		}

		.app-logo {
			width: 120px;
			height: 120px;
			flex-shrink: 0;
			background: var(--bg-surface);
			padding: 0;
			border-radius: 30px;
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
			border: 1px solid var(--border-color);
			overflow: hidden;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}

		.app-details {
			flex: 1;
			text-align: left;

			h3 {
				margin: 0;
				font-size: 2.2em;
				font-weight: 900;
				letter-spacing: -0.04em;
				color: var(--text-color);
			}

			.version-badge {
				display: inline-flex;
				margin-top: 12px;
				padding: 4px 12px;
				background: var(--btn-primary-bg);
				color: #fff;
				border-radius: var(--radius-full);
				font-size: 0.85em;
				font-weight: 800;
				letter-spacing: 0.05em;
				box-shadow: 0 4px 12px rgba(var(--primary-raw-rgb), 0.3);
			}

			.description {
				margin: 20px 0 0;
				font-size: 1.1em;
				color: var(--text-muted);
				line-height: 1.6;
				max-width: 500px;
			}
		}
	}

	.about-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	.about-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
		text-align: left;

		h4 {
			margin: 0;
			font-size: 0.9em;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			color: var(--text-muted);
			font-weight: 700;
		}
	}

	.links-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.link-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		color: var(--text-color);
		cursor: pointer;
		transition: var(--transition-base);
		width: 100%;
		text-align: left;

		&:hover {
			background: var(--bg-surface-hover);
			border-color: var(--btn-primary-bg);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

			.link-label span {
				color: var(--btn-primary-bg);
			}
		}

		.link-icon {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(var(--primary-raw-rgb), 0.1);
			color: var(--btn-primary-bg);
			border-radius: 8px;
			flex-shrink: 0;

			.svg-icon {
				width: 20px;
				height: 20px;
			}
		}

		.link-label {
			display: flex;
			align-items: center;
			flex: 1;
			min-width: 0;

			span {
				font-weight: 700;
				font-size: 0.9em;
				transition: color 0.2s ease;
			}
		}
	}

	.about-footer {
		margin-top: 20px;
		padding-top: 32px;
		border-top: 1px solid var(--border-color);
		text-align: center;
		color: var(--text-muted);
		font-size: 0.9em;

		p {
			margin: 0;
		}

		.credits {
			margin-top: 8px;
			font-style: italic;
			opacity: 0.7;
		}
	}

	@media (max-width: 900px) {
		.about-grid {
			grid-template-columns: 1fr;
		}

		.app-info-card {
			flex-direction: column;
			text-align: center;
			padding: 40px 24px;

			.app-details {
				text-align: center;
				display: flex;
				flex-direction: column;
				align-items: center;
			}
		}
	}
</style>
