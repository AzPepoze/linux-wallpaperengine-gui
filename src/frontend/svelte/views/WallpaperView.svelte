<script lang="ts">
	import Sidebar from '@/components/home/Sidebar.svelte';
	import WallpaperContainer from '@/components/home/WallpaperContainer.svelte';
	import DisplayManager from '@/components/home/DisplayManager.svelte';
	import PlaylistManager from '@/components/home/PlaylistManager.svelte';
	import { quadOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		showDisplayManager,
		showPlaylistManager
	} from '@/scripts/shared/ui';
	import {
		selectedScreen,
		cloneMode,
		screens
	} from '@/scripts/home/display';
	import {
		wallpapers,
		loading,
		error,
		workshopPathValid,
		wallpaperEnginePathValid,
		selectedFolderName,
		activeFolderName,
		selectedWallpaper,
		activeWallpaper,
		setWallpaperData
	} from '@/scripts/home/wallpaperStore';
	import { logger } from '@/scripts/shared/logger';

	let playlistManagerComponent: any;
	let wallpaperContainerComponent: any;

	const pageTransitionInParams = {
		duration: 200,
		delay: 200,
		start: 0.99
	};

	const pageTransitionOutParams = {
		duration: 200,
		start: 0.99
	};

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

	async function handleSelectWallpaper(folderName: string) {
		if ($selectedScreen) {
			await window.electronAPI.setWallpaper(
				$selectedScreen,
				folderName
			);
			activeFolderName.set(folderName);
			screens.update((s) => ({
				...s,
				[$selectedScreen as string]: folderName
			}));
		} else {
			logger.warn('No screen selected for configuration.');
		}
		selectedFolderName.set(folderName);
	}
</script>

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
				<DisplayManager wallpapers={$wallpapers} />
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
					wallpapers={$wallpapers}
					onSelect={handleSelectWallpaper}
					bind:this={playlistManagerComponent}
					selectedWallpaperFolder={$selectedFolderName}
					selectedScreen={$selectedScreen}
					cloneMode={$cloneMode}
					onPlaylistChange={() => {
						if (wallpaperContainerComponent) {
							wallpaperContainerComponent.refreshPlaylists();
						}
					}}
				/>
			</div>
		{/if}

		<WallpaperContainer
			wallpapers={$wallpapers}
			activeWallpaper={$activeWallpaper}
			selectedWallpaper={$selectedWallpaper}
			bind:workshopPathValid={$workshopPathValid}
			bind:wallpaperEnginePathValid={$wallpaperEnginePathValid}
			selectedScreen={$selectedScreen}
			loading={$loading}
			error={$error}
			playlistManager={playlistManagerComponent}
			onSelect={handleSelectWallpaper}
			onWallpapersRefresh={(data) => setWallpaperData(data)}
			bind:this={wallpaperContainerComponent}
		/>
	</div>

	<Sidebar
		selectedWallpaper={$selectedWallpaper}
		onClose={() => selectedFolderName.set(null)}
	/>
</div>

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

	.display-manager-wrapper {
		width: 100%;
	}
</style>
