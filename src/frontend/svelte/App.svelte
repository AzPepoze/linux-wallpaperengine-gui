<script lang="ts">
	import WallpaperView from '@/views/WallpaperView.svelte';
	import WorkshopView from '@/views/WorkshopView.svelte';
	import LogsView from '@/views/LogsView.svelte';
	import SettingsView from '@/views/SettingsView.svelte';
	import { activeView } from '@/scripts/shared/ui';
	import { onMount } from 'svelte';
	import { backOut, cubicOut } from 'svelte/easing';
	import { fly, fade } from 'svelte/transition';
	import { initLogger } from '@/scripts/shared/logger';
	import { loadSettings, settingsStore } from '@/scripts/settings/settings';
	import { 
		initializeApp, 
		setupGlobalListeners 
	} from '@/scripts/shared/appService';
	import { selectedWallpaper } from '@/scripts/home/wallpaperStore';
	import { applyDynamicTheme } from '@/scripts/shared/theme';
	import Topbar from '@/components/shared/layout/Topbar.svelte';
	import Toast from '@/components/shared/ui/Toast.svelte';
	import { toastStore } from '@/scripts/settings/settings';

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
			{#if $activeView === 'wallpapers'}
				<WallpaperView />
			{:else if $activeView === 'workshop'}
				<WorkshopView />
			{:else if $activeView === 'logs'}
				<LogsView />
			{:else if $activeView === 'settings'}
				<SettingsView />
			{/if}
		</div>
	</div>
{/if}

{#if $toastStore}
	<Toast message={$toastStore.message} type={$toastStore.type} />
{/if}

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
</style>
