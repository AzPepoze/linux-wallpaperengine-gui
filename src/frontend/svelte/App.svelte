<script lang="ts">
	import WallpaperView from '@/features/home/WallpaperView.svelte';
	import WorkshopView from '@/features/workshop/WorkshopView.svelte';
	import LogsView from '@/features/logs/LogsView.svelte';
	import SettingsView from '@/features/settings/SettingsView.svelte';
	import { activeView } from '@/core/ui';
	import { onMount } from 'svelte';
	import { backOut, cubicOut } from 'svelte/easing';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { initLogger } from '@/core/logger';
	import { loadSettings, settingsStore } from '@/features/settings/scripts/settings';
	import { 
		initializeApp, 
		setupGlobalListeners 
	} from '@/core/appService';
	import { selectedWallpaper } from '@/features/home/scripts/wallpaperStore';
	import { applyDynamicTheme } from '@/core/theme';
	import Topbar from '@/ui/layout/Topbar.svelte';
	import Toast from '@/ui/Toast.svelte';
	import ContextMenu from '@/ui/ContextMenu.svelte';
	import { toastStore } from '@/core/toastStore';
	import { setLocale } from '@/core/i18n';

	const viewComponents = {
		wallpapers: WallpaperView,
		workshop: WorkshopView,
		logs: LogsView,
		settings: SettingsView
	};

	let appReady = false;
	let lastCheckPaths = '';

	$: {
		applyDynamicTheme($selectedWallpaper, $settingsStore);
	}

	$: {
		if (appReady && $settingsStore) {
			const currentPaths = JSON.stringify([
				$settingsStore.wallpaperEngineDir,
				$settingsStore.steamPaths,
				$settingsStore.wallpaperEngineDir
			]);

			if (currentPaths !== lastCheckPaths) {
				lastCheckPaths = currentPaths;
				initializeApp();
			}
		}
	}

	onMount(() => {
		const cleanup = setupGlobalListeners();
		initLogger();

		const lang = navigator.language?.startsWith('zh') ? 'zh' : 'en';
		setLocale(lang);

		async function init() {
			await loadSettings();
			await initializeApp();
			appReady = true;
		}

		init();
		return cleanup;
	});
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
			<svelte:component this={viewComponents[$activeView]} />
		</div>
	</div>
{/if}

<div class="toast-stack">
	{#each $toastStore as toast (toast.id)}
		<div animate:flip={{ duration: 300 }}>
			<Toast 
				id={toast.id}
				message={toast.message} 
				type={toast.type} 
				duration={toast.duration}
			/>
		</div>
	{/each}
</div>

<ContextMenu />

<style lang="scss">
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

	.toast-stack {
		position: fixed;
		bottom: 32px;
		right: 32px;
		z-index: 2000;
		display: flex;
		flex-direction: column-reverse;
		gap: 12px;
		pointer-events: none;
		align-items: flex-end;
	}
</style>
