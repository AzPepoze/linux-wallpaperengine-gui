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
			class="detected-path-card"
			class:valid={$detectedPathsStore.assetsValid}
		>
			<div class="card-header">
				<div class="status-badge">
					<Icon
						name={$detectedPathsStore.assetsValid
							? 'check_circle'
							: 'error'}
						size={14}
					/>
					<span
						>{$detectedPathsStore.assetsValid
							? 'Currently Active'
							: 'NOT DETECTED'}</span
					>
				</div>
				{#if $detectedPathsStore.assetsValid}
					<Button
						variant="ghost"
						size="sm"
						on:click={openAssetsFolder}
					>
						<Icon name="folder_open" size={14} />
						<span>Open Folder</span>
					</Button>
				{/if}
			</div>
			<div class="path-content">
				<div class="path-label">Detected Path</div>
				<div class="path-display">
					{$detectedPathsStore.assetsPath ||
						'No Wallpaper Engine directory found in search paths.'}
				</div>
			</div>
		</div>
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
			class="detected-path-card"
			class:valid={$detectedPathsStore.workshopValid}
		>
			<div class="card-header">
				<div class="status-badge">
					<Icon
						name={$detectedPathsStore.workshopValid
							? 'check_circle'
							: 'error'}
						size={14}
					/>
					<span
						>{$detectedPathsStore.workshopValid
							? 'Currently Active'
							: 'NOT DETECTED'}</span
					>
				</div>
				{#if $detectedPathsStore.workshopValid}
					<Button
						variant="ghost"
						size="sm"
						on:click={openWallpaperFolder}
					>
						<Icon name="folder_open" size={14} />
						<span>Open Folder</span>
					</Button>
				{/if}
			</div>
			<div class="path-content">
				<div class="path-label">Detected Path</div>
				<div class="path-display">
					{$detectedPathsStore.wallpaperPath ||
						'No workshop directory found in search paths.'}
				</div>
			</div>
		</div>
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
	.detected-path-card {
		margin-top: 12px;
		padding: 16px;
		background: rgba(var(--primary-raw-rgb), 0.03);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: var(--transition-base);
		width: 100%;

		&:hover {
			background: rgba(var(--primary-raw-rgb), 0.05);
			border-color: var(--border-color-hover);
		}

		&.valid {
			border-left: 4px solid var(--success-bg);
			background: linear-gradient(
				90deg,
				rgba(40, 167, 69, 0.05) 0%,
				transparent 100%
			);

			.status-badge {
				background: rgba(40, 167, 69, 0.15);
				color: #81c784;
				border: 1px solid rgba(40, 167, 69, 0.2);
			}
		}

		&:not(.valid) {
			border-left: 4px solid var(--error-bg);
			background: linear-gradient(
				90deg,
				rgba(220, 53, 69, 0.05) 0%,
				transparent 100%
			);

			.status-badge {
				background: rgba(220, 53, 69, 0.15);
				color: #e57373;
				border: 1px solid rgba(220, 53, 69, 0.2);
			}
		}

		.card-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}

		.status-badge {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			border-radius: var(--radius-full);
			font-size: 0.75em;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.path-content {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.path-label {
			font-size: 0.75em;
			font-weight: 700;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			text-align: left;
		}

		.path-display {
			font-family: monospace;
			font-size: 0.85em;
			color: var(--text-color);
			word-break: break-all;
			opacity: 0.9;
			padding: 8px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: var(--radius-sm);
			border: 1px solid rgba(255, 255, 255, 0.05);
			text-align: left;
		}
	}
</style>
