<script lang="ts">
	import Topbar from './components/Topbar.svelte';
	import Settings from './components/Settings.svelte';
	import Sidebar from './components/wallpaper/Sidebar.svelte';
	import WallpaperContainer from './components/wallpaper/WallpaperContainer.svelte';
	import DisplayManager from './components/DisplayManager.svelte';
	import PlaylistManager from './components/wallpaper/PlaylistManager.svelte';
	import Workshop from './components/Workshop.svelte';
	import { initLogger, logger } from './scripts/logger';
	import { onMount } from 'svelte';
	import { quadOut, cubicOut, backOut } from 'svelte/easing';
	import { scale, fly, fade } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		showDisplayManager,
		showPlaylistManager,
		activeView
	} from './scripts/ui';

	import {
		screens,
		selectedScreen,
		cloneMode,
		initDisplay,
		refreshScreens
	} from './scripts/display';
	import LogsPopup from './components/LogsPopup.svelte';
	import Toast from './components/ui/Toast.svelte';
	import {
		toastStore,
		showToast,
		loadSettings,
		settingsStore
	} from './scripts/settings';
	import {
		getDominantColor,
		isLight,
		adjustBrightness
	} from './utils/colorHelper';
	import type { WallpaperData } from '../shared/types';

	let wallpapers: Record<string, WallpaperData> = {};
	let error: string | null = null;
	let loading = true;
	let selectedFolderName: string | null = null;
	let activeFolderName: string | null = null;
	let playlistManagerComponent: any;
	let wallpaperContainerComponent: any;
	let appReady = false;

	$: selectedWallpaper = selectedFolderName
		? {
				...wallpapers[selectedFolderName],
				folderName: selectedFolderName
			}
		: null;

	$: activeWallpaper = activeFolderName
		? { ...wallpapers[activeFolderName], folderName: activeFolderName }
		: null;

	$: {
		if (
			$settingsStore?.dynamicUiTheme &&
			selectedWallpaper?.previewPath
		) {
			getDominantColor(selectedWallpaper.previewPath).then(
				(dominantColor) => {
					if (dominantColor) {
						const cappedBgColor = adjustBrightness(
							dominantColor,
							0.4
						);

						// Capped background dictates global text readability
						const isLightCol = isLight(cappedBgColor);

						const alpha = $settingsStore?.transparentUi
							? ($settingsStore.uiTransparency ?? 80) / 100
							: 1;
						const bgAppCSS = `rgba(${cappedBgColor.join(',')}, ${alpha})`;
						const rawBgOrig = `rgb(${dominantColor.join(',')})`;

						const text = isLightCol
							? 'rgba(0,0,0,0.87)'
							: 'rgba(255,255,255,0.87)';
						const textInverse = isLightCol
							? 'rgba(255,255,255,0.87)'
							: 'rgba(0,0,0,0.87)';

						const root = document.documentElement;
						root.style.setProperty('--bg-app', bgAppCSS);
						root.style.setProperty('--text-color', text);
						root.style.setProperty(
							'--text-inverse',
							textInverse
						);
						root.style.setProperty(
							'--text-muted',
							isLightCol
								? 'rgba(0,0,0,0.6)'
								: 'rgba(255,255,255,0.6)'
						);

						// Modal Backgrounds - mix off the capped base since it's the environment
						const mixColorBg = isLightCol ? 'black' : 'white';
						root.style.setProperty(
							'--bg-modal',
							`color-mix(in srgb, rgb(${cappedBgColor.join(',')}), ${mixColorBg} 10%)`
						);

						// Interactive surfaces - explicitly darker than the background pane
						const surfaceBaseStr = `rgb(${cappedBgColor.join(',')})`;
						root.style.setProperty(
							'--bg-surface',
							`color-mix(in srgb, ${surfaceBaseStr}, black 40%)`
						);
						root.style.setProperty(
							'--bg-surface-hover',
							`color-mix(in srgb, ${surfaceBaseStr}, black 30%)`
						);
						root.style.setProperty(
							'--bg-surface-active',
							`color-mix(in srgb, ${surfaceBaseStr}, black 20%)`
						);

						// Primary buttons - mix off raw original to keep vibrancy
						const mixColorRaw = isLight(dominantColor)
							? 'black'
							: 'white';
						root.style.setProperty(
							'--btn-primary-bg',
							`color-mix(in srgb, ${rawBgOrig}, ${mixColorRaw} 30%)`
						);
						root.style.setProperty(
							'--btn-primary-hover-bg',
							`color-mix(in srgb, ${rawBgOrig}, ${mixColorRaw} 40%)`
						);

						// Expose the raw RGB comma array so SCSS can use rgba(var(--primary-raw-rgb), X) for all shadows/halos
						root.style.setProperty(
							'--primary-raw-rgb',
							dominantColor.join(',')
						);

						// Secondary buttons and borders - use capped background
						const cappedBgStr = `rgb(${cappedBgColor.join(',')})`;
						const mixColor = isLightCol ? 'black' : 'white';
						root.style.setProperty(
							'--btn-secondary-bg',
							`color-mix(in srgb, ${cappedBgStr}, ${mixColor} 15%)`
						);
						root.style.setProperty(
							'--btn-secondary-hover-bg',
							`color-mix(in srgb, ${cappedBgStr}, ${mixColor} 25%)`
						);

						root.style.setProperty(
							'--border-color',
							`color-mix(in srgb, ${cappedBgStr}, ${mixColor} 15%)`
						);
						root.style.setProperty(
							'--border-color-hover',
							`color-mix(in srgb, ${cappedBgStr}, ${mixColor} 25%)`
						);
					}
				}
			);
		} else {
			const root = document.documentElement;
			const alpha = $settingsStore?.transparentUi
				? ($settingsStore.uiTransparency ?? 80) / 100
				: 1;
			root.style.setProperty('--bg-app', `rgba(29, 29, 29, ${alpha})`);
			root.style.removeProperty('--text-color');
			root.style.removeProperty('--text-inverse');
			root.style.removeProperty('--text-muted');
			root.style.removeProperty('--bg-surface');
			root.style.removeProperty('--bg-surface-hover');
			root.style.removeProperty('--bg-surface-active');
			root.style.removeProperty('--bg-modal');
			root.style.removeProperty('--btn-primary-bg');
			root.style.removeProperty('--btn-primary-hover-bg');
			root.style.removeProperty('--btn-secondary-bg');
			root.style.removeProperty('--btn-secondary-hover-bg');
			root.style.removeProperty('--border-color');
			root.style.removeProperty('--border-color-hover');
			root.style.removeProperty('--primary-raw-rgb');
		}
	}

	async function initialize() {
		loading = true;

		initDisplay();
		logger.log('Application initialized');

		// Main process handles init
		if (window.electronAPI.validateExecutable) {
			await window.electronAPI.validateExecutable();
		}

		const {
			wallpapers: loadedWallpapers,
			error: loadError,
			selectedWallpaper: initialWallpaper
		} = await window.electronAPI.loadWallpapers();

		wallpapers = loadedWallpapers;
		error = loadError;

		loading = false;

		if (initialWallpaper) {
			selectedFolderName = initialWallpaper.folderName;
			activeFolderName = initialWallpaper.folderName;
		}

		return initialWallpaper;
	}

	function customSlide(
		node: HTMLElement,
		{ delay = 0, duration = 400, easing = quadOut } = {}
	): TransitionConfig {
		const style = getComputedStyle(node);
		const opacity = +style.opacity;
		const height = node.offsetHeight;

		return {
			delay,
			duration,
			easing,
			css: (t: number) => {
				const eased = easing(t);
				return `
                         height: ${eased * height}px;
                         opacity: ${Math.min(t * 2, 1) * opacity};
                    `;
			}
		};
	}

	onMount(async () => {
		// Listen for toasts from main process
		window.electronAPI.on(
			'show-toast',
			(data: {
				message: string;
				type: 'success' | 'error' | 'warn' | 'info';
				duration?: number;
			}) => {
				showToast(data.message, data.type, data.duration);
			}
		);

		initLogger();
		await loadSettings();
		const initialWallpaper = await initialize();
		await refreshScreens();

		if (!selectedFolderName) {
			if ($selectedScreen && $screens[$selectedScreen]) {
				activeFolderName = $screens[$selectedScreen];
				selectedFolderName = activeFolderName;
			} else if (initialWallpaper) {
				selectedFolderName = initialWallpaper.folderName;
			}
		}

		appReady = true;

		const handleLinkClick = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest('a');
			if (target && target.href) {
				const url = target.href;
				if (
					url.startsWith('http') ||
					url.startsWith('mailto:') ||
					url.startsWith('tel:')
				) {
					e.preventDefault();
					e.stopPropagation();
					setTimeout(() => {
						window.electronAPI.openExternal(url);
					}, 100);
				}
			}
		};

		document.addEventListener('click', handleLinkClick, true);
	});

	async function handleSelectWallpaper(folderName: string) {
		if ($selectedScreen) {
			await window.electronAPI.setWallpaper(
				$selectedScreen,
				folderName
			);
			activeFolderName = folderName;
			screens.update((s) => ({
				...s,
				[$selectedScreen as string]: folderName
			}));
		} else {
			logger.warn('No screen selected for configuration.');
		}
		selectedFolderName = folderName;
	}

	const pageTransitionInParams = {
		duration: 200,
		delay: 200,
		start: 0.99
	};

	const pageTransitionOutParams = {
		duration: 200,
		start: 0.99
	};
</script>

{#if appReady}
	<div class="app-container" in:fade={{ duration: 600 }}>
		<div in:fly={{ y: -40, duration: 800, delay: 150, easing: backOut }}>
			<Topbar />
		</div>

		<div
			class="content"
			in:fly={{ y: 30, duration: 800, delay: 350, easing: cubicOut }}
		>
			{#if $activeView === 'wallpapers'}
				<div
					class="view-container wallpapers-layout"
					in:scale={pageTransitionInParams}
					out:scale={pageTransitionOutParams}
				>
					<div class="workspace">
						{#if $showDisplayManager}
							<div
								class="display-manager-wrapper"
								transition:customSlide={{
									duration: 400
								}}
							>
								<DisplayManager {wallpapers} />
							</div>
						{/if}

						{#if $showPlaylistManager}
							<div
								class="display-manager-wrapper"
								transition:customSlide={{
									duration: 400
								}}
							>
								<PlaylistManager
									{wallpapers}
									onSelect={handleSelectWallpaper}
									bind:this={
										playlistManagerComponent
									}
									selectedWallpaperFolder={selectedFolderName}
									selectedScreen={$selectedScreen}
									cloneMode={$cloneMode}
									onPlaylistChange={() => {
										if (
											wallpaperContainerComponent
										) {
											wallpaperContainerComponent.refreshPlaylists();
										}
									}}
								/>
							</div>
						{/if}

						<WallpaperContainer
							{wallpapers}
							{activeWallpaper}
							{selectedWallpaper}
							selectedScreen={$selectedScreen}
							{loading}
							{error}
							playlistManager={playlistManagerComponent}
							onSelect={handleSelectWallpaper}
							bind:this={wallpaperContainerComponent}
						/>
					</div>

					<Sidebar
						{selectedWallpaper}
						onClose={() => (selectedFolderName = null)}
					/>
				</div>
			{:else if $activeView === 'workshop'}
				<div
					class="view-container"
					in:scale={pageTransitionInParams}
					out:scale={pageTransitionOutParams}
				>
					<Workshop />
				</div>
			{:else if $activeView === 'logs'}
				<div
					class="view-container"
					in:scale={pageTransitionInParams}
					out:scale={pageTransitionOutParams}
				>
					<LogsPopup />
				</div>
			{:else if $activeView === 'settings'}
				<div
					class="view-container"
					in:scale={pageTransitionInParams}
					out:scale={pageTransitionOutParams}
				>
					<Settings />
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if $toastStore}
	<Toast message={$toastStore.message} type={$toastStore.type} />
{/if}

<style lang="scss">
	.view-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
		box-sizing: border-box;
		padding: 20px;
	}

	.wallpapers-layout {
		flex-direction: row;
	}

	.workspace {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		min-width: 0;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.content {
		display: flex;
		min-height: 0;
		max-width: 100%;
		flex-grow: 1;
		padding: 10px;
		position: relative;
	}

	.display-manager-wrapper {
		width: 100%;
	}
</style>
