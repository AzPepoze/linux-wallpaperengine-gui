<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Browse from '@/ui/Browse.svelte';
	import Button from '@/ui/Button.svelte';
	import PathListEditor from '@/ui/PathListEditor.svelte';
	import Icon from '@/ui/Icon.svelte';
	import { t } from '@/core/i18n';
	import {
		settingsStore,
		validateBinaryFile,
		detectedPathsStore,
		openAssetsFolder,
		openWallpaperFolder
	} from '@/features/settings/scripts/settings';

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
		label={$t('settings.executable.binaryLocation')}
		id="binary"
		vertical
		description={$t('settings.executable.binaryLocationDesc')}
	>
		<Browse
			bind:location={$settingsStore.binaryLocation}
			onSelect={onSelectBinFile}
			placeholder={$t('settings.executable.binaryPlaceholder')}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.executable.wallpaperEngineDir')}
		id="wallpaperEngineDir"
		vertical
		description={$t('settings.executable.wallpaperEngineDirDesc')}
	>
		<Browse
			bind:location={$settingsStore.wallpaperEngineDir}
			onSelect={onSelectWallpaperEngineDir}
			dir={true}
			placeholder={$t('settings.executable.weDirPlaceholder')}
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
							? $t('settings.executable.currentlyActive')
							: $t('settings.executable.notDetected')}</span
					>
				</div>
				{#if $detectedPathsStore.assetsValid}
					<Button
						variant="ghost"
						size="sm"
						on:click={openAssetsFolder}
					>
						<Icon name="folder_open" size={14} />
						<span>{$t('settings.executable.openFolder')}</span>
					</Button>
				{/if}
			</div>
			<div class="path-content">
				<div class="path-label">{$t('settings.executable.detectedPath')}</div>
				<div class="path-display">
					{$detectedPathsStore.assetsPath ||
						$t('settings.executable.noWeDirFound')}
				</div>
			</div>
		</div>
	</SettingItem>

	<SettingItem
		label={$t('settings.executable.workshopDir')}
		id="workshopDir"
		vertical
		description={$t('settings.executable.workshopDirDesc')}
	>
		<Browse
			bind:location={$settingsStore.workshopDir}
			onSelect={onSelectWorkshopDir}
			dir={true}
			placeholder={$t('settings.executable.workshopDirPlaceholder')}
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
							? $t('settings.executable.currentlyActive')
							: $t('settings.executable.notDetected')}</span
					>
				</div>
				{#if $detectedPathsStore.workshopValid}
					<Button
						variant="ghost"
						size="sm"
						on:click={openWallpaperFolder}
					>
						<Icon name="folder_open" size={14} />
						<span>{$t('settings.executable.openFolder')}</span>
					</Button>
				{/if}
			</div>
			<div class="path-content">
				<div class="path-label">{$t('settings.executable.detectedPath')}</div>
				<div class="path-display">
					{$detectedPathsStore.wallpaperPath ||
						$t('settings.executable.noWorkshopDirFound')}
				</div>
			</div>
		</div>
	</SettingItem>

	<SettingItem
		label={$t('settings.executable.steamSearchPaths')}
		id="steamPaths"
		vertical
		description={$t('settings.executable.steamSearchPathsDesc')}
	>
		<PathListEditor
			bind:items={$settingsStore.steamPaths}
			placeholder={$t('settings.executable.steamPathsPlaceholder')}
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
			.status-badge {
				background: rgba(40, 167, 69, 0.15);
				color: #81c784;
				border: 1px solid rgba(40, 167, 69, 0.2);
			}
		}

		&:not(.valid) {
			border-color: rgba(220, 53, 69, 0.3);
			background: rgba(220, 53, 69, 0.02);

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
			border-radius: var(--radius-sm);
			font-size: 0.85em;
			font-weight: 500;
		}

		.path-content {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.path-label {
			font-size: 0.85em;
			font-weight: 500;
			color: var(--text-muted);
			text-align: left;
		}

		.path-display {
			font-family: monospace;
			font-size: 0.85em;
			color: var(--text-color);
			word-break: break-all;
			opacity: 0.9;
			padding: 8px 10px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: var(--radius-sm);
			border: 1px solid rgba(255, 255, 255, 0.05);
			text-align: left;
		}
	}
</style>
