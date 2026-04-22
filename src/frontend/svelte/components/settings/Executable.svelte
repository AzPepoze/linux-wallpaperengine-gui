<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Browse from '@/components/shared/ui/Browse.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import ListEditor from '@/components/shared/ui/ListEditor.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import { 
		settingsStore, 
		validateBinaryFile, 
		detectedPathsStore, 
		openAssetsFolder, 
		openWallpaperFolder 
	} from '@/scripts/settings/settings';

	const onSelectBinFile = async (path: string) => {
		const isValid = await validateBinaryFile(path);
		if (!isValid && $settingsStore) {
			$settingsStore.binaryLocation = '';
		}
	};

	const onSelectWallpaperEngineDir = async (path: string) => {
		if ($settingsStore) {
			$settingsStore.wallpaperEngineDir = path;
		}
	};

	const onSelectWorkshopDir = async (path: string) => {
		if ($settingsStore) {
			$settingsStore.workshopDir = path;
		}
	};
</script>

{#if $settingsStore}
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
		label="Wallpaper Engine Directory"
		id="wallpaperEngineDir"
		vertical
		description="Main folder where Wallpaper Engine is installed (steamapps/common/wallpaper_engine)."
	>
		<Browse
			bind:location={$settingsStore.wallpaperEngineDir}
			onSelect={onSelectWallpaperEngineDir}
			dir={true}
			placeholder="Path to wallpaper_engine folder..."
		/>
		<div
			class="detected-path-info"
			class:valid={$detectedPathsStore.assetsValid}
		>
			<div class="status-tag">
				<span class="status-dot"></span>
				{$detectedPathsStore.assetsValid
					? 'Currently Active'
					: 'NOT DETECTED'}
			</div>
			<div class="path-display">
				{$detectedPathsStore.assetsPath ||
					'No Wallpaper Engine directory found in search paths.'}
			</div>
		</div>
		{#if $detectedPathsStore.assetsValid}
			<div class="setting-actions">
				<Button
					variant="ghost"
					on:click={openAssetsFolder}
				>
					<Icon name="folder_open" size={16} />
					<span>Open Wallpaper Engine Folder</span>
				</Button>
			</div>
		{/if}
	</SettingItem>

	<SettingItem
		label="Workshop Directory"
		id="workshopDir"
		vertical
		description="Path to your Steam Workshop content (431960). Usually auto-detected from the Wallpaper Engine Directory above."
	>
		<Browse
			bind:location={$settingsStore.workshopDir}
			onSelect={onSelectWorkshopDir}
			dir={true}
			placeholder="Path to workshop content (431960)..."
		/>
		<div
			class="detected-path-info"
			class:valid={$detectedPathsStore.workshopValid}
		>
			<div class="status-tag">
				<span class="status-dot"></span>
				{$detectedPathsStore.workshopValid
					? 'Currently Active'
					: 'NOT DETECTED'}
			</div>
			<div class="path-display">
				{$detectedPathsStore.wallpaperPath ||
					'No workshop directory found in search paths.'}
			</div>
		</div>
		{#if $detectedPathsStore.workshopValid}
			<div class="setting-actions">
				<Button
					variant="ghost"
					on:click={openWallpaperFolder}
				>
					<Icon name="folder_open" size={16} />
					<span>Open Workshop Folder</span>
				</Button>
			</div>
		{/if}
	</SettingItem>

	<SettingItem
		label="Steam Search Paths"
		id="steamPaths"
		vertical
		description="Additional directories to search for Steam workshop content."
	>
		<ListEditor
			bind:items={$settingsStore.steamPaths}
			placeholder="e.g. .local/share/Steam"
		/>
	</SettingItem>
{/if}

<style lang="scss">
	.detected-path-info {
		margin-top: 10px;
		padding: 10px;
		background: var(--bg-surface-hover);
		border-radius: var(--radius-md);
		border-left: 4px solid var(--text-muted);
		font-size: 0.85em;

		&.valid {
			border-left-color: #4caf50;
			.status-dot { background: #4caf50; }
		}

		.status-tag {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 700;
			margin-bottom: 4px;
			text-transform: uppercase;
			font-size: 0.8em;
			color: var(--text-muted);
		}

		.status-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: var(--text-muted);
		}

		.path-display {
			color: var(--text-color);
			word-break: break-all;
			opacity: 0.8;
		}
	}

	.setting-actions {
		margin-top: 8px;
	}
</style>
