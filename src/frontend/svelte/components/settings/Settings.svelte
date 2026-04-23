<script lang="ts">
	import { onMount } from 'svelte';
	import General from '@/components/settings/General.svelte';
	import Audio from '@/components/settings/Audio.svelte';
	import Interaction from '@/components/settings/Interaction.svelte';
	import Advanced from '@/components/settings/Advanced.svelte';
	import Executable from '@/components/settings/Executable.svelte';
	import {
		settingsStore,
		loadSettings,
		saveSettings,
		openConfigFile,
		updateDetectedPaths
	} from '@/scripts/settings/settings';
	import SettingsSection from '@/components/settings/SettingsSection.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';

	let saveTimeout: ReturnType<typeof setTimeout>;
	let initialLoadDone = false;
	let unsubscribe: () => void;

	const sections = [
		{
			id: 'general',
			label: 'General',
			icon: 'monitor',
			component: General
		},
		{ id: 'audio', label: 'Audio', icon: 'volume_up', component: Audio },
		{
			id: 'interaction',
			label: 'Interaction',
			icon: 'mouse',
			component: Interaction
		},
		{
			id: 'advanced',
			label: 'Advanced',
			icon: 'settings',
			component: Advanced
		},
		{
			id: 'executable',
			label: 'Executable',
			icon: 'folder',
			component: Executable
		}
	];

	let activeSection = 'general';
	let contentElement: HTMLElement;

	function scrollToSection(id: string) {
		activeSection = id;
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	onMount(() => {
		async function init() {
			await loadSettings();
			await updateDetectedPaths();
			initialLoadDone = true;

			unsubscribe = settingsStore.subscribe((value) => {
				if (value && initialLoadDone) {
					clearTimeout(saveTimeout);
					saveTimeout = setTimeout(() => {
						saveSettings(value, true);
					}, 1000);
				}
			});
		}

		if (contentElement) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							activeSection = entry.target.id;
						}
					});
				},
				{
					root: contentElement,
					threshold: 0.5
				}
			);

			sections.forEach((s) => {
				const el = document.getElementById(s.id);
				if (el) observer.observe(el);
			});
		}

		init();

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	const handleOpenConfig = async () => {
		await openConfigFile();
	};
</script>

<div class="settings-container">
	<aside class="settings-sidebar">
		<div class="sidebar-header">
			<h2>Settings</h2>
			<p>Configure your experience</p>
		</div>
		<nav class="sidebar-nav">
			{#each sections as section}
				<button
					class="nav-item"
					class:active={activeSection === section.id}
					on:click={() => scrollToSection(section.id)}
				>
					<Icon name={section.icon} size={18} />
					<span>{section.label}</span>
				</button>
			{/each}
		</nav>

		<div class="sidebar-actions">
			<button class="action-btn secondary" on:click={handleOpenConfig}>
				Open Config
			</button>
		</div>
	</aside>

	<main class="settings-main" bind:this={contentElement}>
		{#if $settingsStore}
			<div class="content-wrapper">
				{#each sections as section}
					<SettingsSection title={section.label} id={section.id}>
						<svelte:component this={section.component} />
					</SettingsSection>
					<div class="divider"></div>
				{/each}
			</div>
		{:else}
			<div class="loading-container">
				<div class="spinner"></div>
				<p>Loading settings...</p>
			</div>
		{/if}
	</main>
</div>

<style lang="scss">
	.settings-container {
		display: flex;
		height: 100%;
		width: 100%;
		overflow: hidden;
		position: relative;
	}

	.settings-sidebar {
		width: 260px;
		display: flex;
		flex-direction: column;
		padding: 40px 12px;
		z-index: 10;

		.sidebar-header {
			padding: 0 20px 40px;
			h2 {
				margin: 0;
				font-size: 1.8em;
				font-weight: 900;
				letter-spacing: -0.03em;
				background: var(--text-color);
				background-clip: text;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			p {
				margin: 6px 0 0;
				font-size: 0.9em;
				color: var(--text-muted);
				font-weight: 500;
			}
		}

		.sidebar-nav {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;

			.nav-item {
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 12px 20px;
				background: transparent;
				border: none;
				color: var(--text-muted);
				border-radius: var(--radius-lg);
				cursor: pointer;
				transition: var(--transition-base);
				text-align: left;
				font-weight: 600;
				position: relative;
				overflow: hidden;

				&:hover {
					background: var(--bg-surface-hover);
					color: var(--text-color);
					padding-left: 24px;
				}

				&.active {
					background: var(--bg-surface-active);
					color: var(--btn-primary-bg);
					box-shadow: inset 0 0 0 1px var(--border-color-hover);
				}

				span {
					font-size: 0.95em;
				}
			}
		}

		.sidebar-actions {
			display: flex;
			flex-direction: column;
			gap: 12px;
			padding: 24px 8px 0;
			border-top: 1px solid var(--border-color);
		}
	}

	.action-btn {
		width: 100%;
		padding: 14px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		font-weight: 700;
		font-size: 0.9em;
		cursor: pointer;
		transition: var(--transition-base);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;

		&.secondary {
			background: var(--bg-surface);
			color: var(--text-color);
			&:hover {
				background: var(--bg-surface-hover);
				border-color: var(--text-muted);
				transform: translateY(-1px);
			}
		}
	}

	.settings-main {
		flex: 1;
		overflow-y: auto;
		scroll-behavior: smooth;
		position: relative;
		background: radial-gradient(
			circle at top right,
			rgba(var(--primary-raw-rgb), 0.05),
			transparent 40%
		);

		.content-wrapper {
			max-width: 850px;
			margin: 0 auto;
			padding: 80px 60px 120px;
			display: flex;
			flex-direction: column;
			gap: 64px;
		}
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		gap: 20px;

		.spinner {
			width: 40px;
			height: 40px;
			border: 3px solid var(--bg-surface);
			border-top-color: var(--btn-primary-bg);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}
	}

	.divider {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--border-color) 20%,
			var(--border-color) 80%,
			transparent
		);
		opacity: 0.5;
	}
</style>
