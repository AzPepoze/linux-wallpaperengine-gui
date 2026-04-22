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
		{ id: 'general', label: 'General', icon: 'monitor', component: General },
		{ id: 'audio', label: 'Audio', icon: 'volume_up', component: Audio },
		{ id: 'interaction', label: 'Interaction', icon: 'mouse', component: Interaction },
		{ id: 'advanced', label: 'Advanced', icon: 'settings', component: Advanced },
		{ id: 'executable', label: 'Executable', icon: 'folder', component: Executable }
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
		border-radius: var(--radius-xl);
		overflow: hidden;
		border: 1px solid var(--border-color);
		box-shadow: var(--shadow-lg);
		background: var(--bg-modal);
	}

	.settings-sidebar {
		width: 280px;
		background: var(--bg-modal);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		padding: 32px 16px;

		.sidebar-header {
			padding: 0 16px 32px;
			h2 {
				margin: 0;
				font-size: 1.5em;
				font-weight: 800;
				background: linear-gradient(
					135deg,
					var(--text-color) 0%,
					var(--text-muted) 100%
				);
				background-clip: text;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			p {
				margin: 4px 0 0;
				font-size: 0.85em;
				color: var(--text-muted);
			}
		}

		.sidebar-nav {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4px;

			.nav-item {
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 12px 16px;
				background: transparent;
				border: none;
				color: var(--text-muted);
				border-radius: var(--radius-md);
				cursor: pointer;
				transition: var(--transition-base);
				text-align: left;
				font-weight: 500;

				&:hover {
					background: var(--bg-surface-hover);
					color: var(--text-color);
				}

				&.active {
					background: var(--btn-primary-bg);
					color: var(--text-color);
					box-shadow: 0 4px 12px var(--shadow-primary);
				}
			}
		}

		.sidebar-actions {
			display: flex;
			flex-direction: column;
			gap: 12px;
			padding-top: 24px;
			border-top: 1px solid var(--border-color);
		}
	}

	.action-btn {
		width: 100%;
		padding: 12px;
		border-radius: var(--radius-md);
		border: none;
		font-weight: 600;
		font-size: 0.9em;
		cursor: pointer;
		transition: var(--transition-base);

		&.secondary {
			background: var(--bg-surface);
			color: var(--text-color);
			border: 1px solid var(--border-color);
			&:hover {
				background: var(--bg-surface-hover);
			}
		}
	}

	.settings-main {
		flex: 1;
		overflow-y: auto;
		scroll-behavior: smooth;
		position: relative;

		.content-wrapper {
			max-width: 1000px;
			margin: 0 auto;
			padding: 60px 40px 120px;
			display: flex;
			flex-direction: column;
			gap: 48px;
		}
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-weight: 500;
	}

	.divider {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--border-color), transparent);
	}
</style>
