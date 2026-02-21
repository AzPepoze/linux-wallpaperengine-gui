<script lang="ts">
	import { onMount } from 'svelte';
	import {
		settingsStore,
		loadSettings,
		saveSettings,
		openConfigFile,
		validateBinaryFile,
		showToast
	} from '../scripts/settings';
	import { WORKSHOP_CONTENT_SUFFIX } from '../../shared/constants';

	import SettingsSection from './settings/SettingsSection.svelte';
	import SettingItem from './ui/SettingItem.svelte';
	import Toggle from './ui/Toggle.svelte';
	import Input from './ui/Input.svelte';
	import Select from './ui/Select.svelte';
	import Range from './ui/Range.svelte';
	import Browse from './ui/Browse.svelte';
	import Button from './ui/Button.svelte';
	// Icons
	import DisplayIcon from '../icons/DisplayIcon.svelte';
	import AudioIcon from '../icons/AudioIcon.svelte';
	import MouseIcon from '../icons/MouseIcon.svelte';
	import SettingIcon from '../icons/SettingIcon.svelte';
	import FolderIcon from '../icons/FolderIcon.svelte';

	const scalingOptions = [
		{ value: 'default', label: 'Default' },
		{ value: 'stretch', label: 'Stretch' },
		{ value: 'fit', label: 'Fit' },
		{ value: 'fill', label: 'Fill' }
	];

	const clampingOptions = [
		{ value: 'clamp', label: 'Clamp' },
		{ value: 'border', label: 'Border' },
		{ value: 'repeat', label: 'Repeat' }
	];

	const sections = [
		{ id: 'general', label: 'General', icon: DisplayIcon },
		{ id: 'audio', label: 'Audio', icon: AudioIcon },
		{ id: 'interaction', label: 'Interaction', icon: MouseIcon },
		{ id: 'advanced', label: 'Advanced', icon: SettingIcon },
		{
			id: 'executable',
			label: 'Linux Wallpaper Engine',
			icon: FolderIcon
		}
	];

	let activeSection = 'general';
	let contentElement: HTMLElement;
	let initialLoad = true;
	let saveTimeout: ReturnType<typeof setTimeout>;

	$: if ($settingsStore && !initialLoad) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			handleSaveSettings();
		}, 300);
	}

	function scrollToSection(id: string) {
		activeSection = id;
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	onMount(async () => {
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

		await loadSettings();

		// Wait a small bit to ensure reactivity from loadSettings doesn't trigger a save
		setTimeout(() => {
			initialLoad = false;
		}, 500);
	});

	const onSelectBinFile = async (path: string) => {
		const isValid = await validateBinaryFile(path);
		if (!isValid && $settingsStore) {
			$settingsStore.binaryLocation = '';
		}
	};

	const onSelectAssetsDir = async (path: string) => {
		if ($settingsStore) {
			$settingsStore.assetsDir = path;
		}
	};

	const onSelectWallpaperEngineDir = async (path: string) => {
		if ($settingsStore) {
			$settingsStore.wallpaperEngineDir = path;
		}
	};

	const handleSaveSettings = async () => {
		if ($settingsStore) {
			await saveSettings($settingsStore);
		}
	};

	const handleOpenConfig = async () => {
		await openConfigFile();
	};

	const handleClearAll = async () => {
		if (confirm('Are you sure you want to clear all wallpapers?')) {
			const result = await window.electronAPI.clearAllWallpapers();
			if (result.success) {
				showToast('All wallpapers cleared', 'success');
			} else {
				showToast(`Error: ${result.error}`, 'error');
			}
		}
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
					<svelte:component
						this={section.icon}
						width="18"
						height="18"
					/>
					<span>{section.label}</span>
				</button>
			{/each}
		</nav>

		<div class="sidebar-actions">
			<button class="action-btn secondary" on:click={handleOpenConfig}>
				Open Config
			</button>
			<button class="action-btn danger" on:click={handleClearAll}>
				Clear All
			</button>
		</div>
	</aside>

	<main class="settings-main" bind:this={contentElement}>
		{#if $settingsStore}
			<div class="content-wrapper">
				<SettingsSection
					title="General"
					id="general"
					description="Basic wallpaper engine behavior and performance."
				>
					<SettingItem
						label="Dynamic UI Theme"
						id="dynamicUiTheme"
						description="Adapt application colors to match the currently selected wallpaper."
					>
						<Toggle
							id="dynamicUiTheme"
							bind:checked={$settingsStore.dynamicUiTheme}
						/>
					</SettingItem>

					<SettingItem
						label="Dynamic Sidebar Theme"
						id="dynamicSidebarTheme"
						description="Apply wallpaper colors locally to the sidebar directly."
					>
						<Toggle
							id="dynamicSidebarTheme"
							bind:checked={
								$settingsStore.dynamicSidebarTheme
							}
						/>
					</SettingItem>

					<SettingItem
						label="Transparent UI"
						id="transparentUi"
						description="Make the window background transparent (requires restart)."
					>
						<Toggle
							id="transparentUi"
							bind:checked={$settingsStore.transparentUi}
							onChange={() => {
								if (
									confirm(
										'Changing UI transparency requires a restart. Do you want to restart now?'
									)
								) {
									handleSaveSettings().then(() => {
										window.electronAPI.restartUI();
									});
								}
							}}
						/>
					</SettingItem>

					{#if $settingsStore.transparentUi}
						<SettingItem
							label="UI Transparency Level"
							id="uiTransparency"
							description="Adjust the opacity of the application."
						>
							<Range
								id="uiTransparency"
								bind:value={
									$settingsStore.uiTransparency
								}
								min={10}
								max={100}
								step={5}
							/>
						</SettingItem>
					{/if}

					<SettingItem
						label="FPS Limit"
						id="fps"
						description="Target frames per second for animations."
					>
						<Input
							type="number"
							id="fps"
							bind:value={$settingsStore.fps}
							min={1}
						/>
					</SettingItem>

					<SettingItem
						label="Scaling Mode"
						id="scaling"
						description="How the wallpaper fits the screen."
					>
						<Select
							id="scaling"
							bind:value={$settingsStore.scaling}
							options={scalingOptions}
						/>
					</SettingItem>

					<SettingItem
						label="Clamping Mode"
						id="clamping"
						description="Texture wrapping behavior."
					>
						<Select
							id="clamping"
							bind:value={$settingsStore.clamping}
							options={clampingOptions}
						/>
					</SettingItem>

					<SettingItem
						label="No Fullscreen Pause"
						id="noFullscreenPause"
						description="Keep running when other apps are fullscreen."
					>
						<Toggle
							id="noFullscreenPause"
							bind:checked={
								$settingsStore.noFullscreenPause
							}
						/>
					</SettingItem>

					<SettingItem
						label="Disable Particles"
						id="disableParticles"
						description="Turn off particle effects to save resources."
					>
						<Toggle
							id="disableParticles"
							bind:checked={
								$settingsStore.disableParticles
							}
						/>
					</SettingItem>
				</SettingsSection>

				<div class="divider"></div>

				<SettingsSection
					title="Audio"
					id="audio"
					description="Control how audio is handled in wallpapers."
				>
					<SettingItem
						label="Silence Wallpaper"
						id="silence"
						description="Mute all audio output."
					>
						<Toggle
							id="silence"
							bind:checked={$settingsStore.silence}
						/>
					</SettingItem>

					{#if !$settingsStore.silence}
						<SettingItem
							label="Volume"
							id="volume"
							description="Adjust master volume level."
						>
							<Range
								id="volume"
								bind:value={$settingsStore.volume}
								min={0}
								max={100}
							/>
						</SettingItem>

						<SettingItem
							label="No Automute"
							id="noAutomute"
							description="Prevent automatic muting when not in focus."
						>
							<Toggle
								id="noAutomute"
								bind:checked={$settingsStore.noAutomute}
							/>
						</SettingItem>

						<SettingItem
							label="No Audio Processing"
							id="noAudioProcessing"
							description="Disable audio analysis features."
						>
							<Toggle
								id="noAudioProcessing"
								bind:checked={
									$settingsStore.noAudioProcessing
								}
							/>
						</SettingItem>
					{/if}
				</SettingsSection>

				<div class="divider"></div>

				<SettingsSection
					title="Interaction"
					id="interaction"
					description="Customize how you interact with wallpapers."
				>
					<SettingItem
						label="Disable Mouse"
						id="disableMouse"
						description="Ignore mouse movement and clicks."
					>
						<Toggle
							id="disableMouse"
							bind:checked={$settingsStore.disableMouse}
						/>
					</SettingItem>

					<SettingItem
						label="Disable Parallax"
						id="disableParallax"
						description="Turn off mouse-following parallax effects."
					>
						<Toggle
							id="disableParallax"
							bind:checked={$settingsStore.disableParallax}
						/>
					</SettingItem>
				</SettingsSection>

				<div class="divider"></div>

				<SettingsSection
					title="Advanced"
					id="advanced"
					description="Power user options and custom parameters."
				>
					<SettingItem
						label="Use Native Wayland"
						id="nativeWayland"
						description="Run the GUI with native Wayland support (requires restart)."
					>
						<Toggle
							id="nativeWayland"
							bind:checked={$settingsStore.nativeWayland}
							onChange={() => {
								if (
									confirm(
										'Changing Wayland support requires a restart. Do you want to restart now?'
									)
								) {
									handleSaveSettings().then(() => {
										window.electronAPI.restartUI();
									});
								}
							}}
						/>
					</SettingItem>

					<SettingItem
						label="Enable Custom Arguments"
						id="customArgsEnabled"
					>
						<Toggle
							id="customArgsEnabled"
							bind:checked={
								$settingsStore.customArgsEnabled
							}
						/>
					</SettingItem>

					{#if $settingsStore.customArgsEnabled}
						<SettingItem
							label="Custom Command Args"
							id="customArgs"
							vertical
							description="Pass raw arguments to the backend."
						>
							<Input
								type="text"
								id="customArgs"
								bind:value={$settingsStore.customArgs}
								placeholder="e.g. --window 0x0x1920x1080"
							/>
							<div class="doc-actions">
								<Button
									variant="ghost"
									on:click={() =>
										window.electronAPI.openExternal(
											'https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options'
										)}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path
											d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
										/>
										<polyline
											points="15 3 21 3 21 9"
										/>
										<line
											x1="10"
											y1="14"
											x2="21"
											y2="3"
										/>
									</svg>
									Common Options Documentation
								</Button>
							</div>
						</SettingItem>
					{/if}
				</SettingsSection>

				<div class="divider"></div>

				<SettingsSection
					title="Linux Wallpaper Engine"
					id="executable"
					description="Configure system paths and executable locations."
				>
					<SettingItem
						label="Binary Location"
						id="binary"
						vertical
						description="Set the path to your linux-wallpaperengine binary. Leave empty to use system PATH."
					>
						<Browse
							bind:location={$settingsStore.binaryLocation}
							onSelect={onSelectBinFile}
							placeholder="Path to linux-wallpaperengine binary..."
						/>
					</SettingItem>

					<SettingItem
						label="Assets Directory"
						id="assetsDir"
						vertical
						description="Folder where the assets are stored."
					>
						<Browse
							bind:location={$settingsStore.assetsDir}
							onSelect={onSelectAssetsDir}
							dir={true}
							placeholder="Path to assets directory..."
						/>
					</SettingItem>

					<SettingItem
						label="Wallpaper Engine Directory"
						id="wallpaperEngineDir"
						vertical
						description="Path to your Steam Workshop content (e.g. {WORKSHOP_CONTENT_SUFFIX}). Leave empty to use auto-detect."
					>
						<Browse
							bind:location={
								$settingsStore.wallpaperEngineDir
							}
							onSelect={onSelectWallpaperEngineDir}
							dir={true}
							placeholder="Path to wallpaper engine workshop directory..."
						/>
					</SettingItem>
				</SettingsSection>
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
			gap: 10px;
			padding-top: 24px;
			border-top: 1px solid var(--border-color);
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
		background: linear-gradient(
			90deg,
			transparent,
			var(--border-color),
			transparent
		);
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

		&.danger {
			background: transparent;
			color: var(--error-color);
			&:hover {
				background: var(--error-bg-translucent);
			}
		}
	}

	.doc-actions {
		margin-top: 12px;
		display: flex;
		justify-content: flex-start;
	}
</style>
