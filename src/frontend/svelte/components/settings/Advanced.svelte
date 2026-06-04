<script lang="ts">
	import Button from '@/components/shared/ui/Button.svelte';
	import CopyableCode from '@/components/shared/ui/CopyableCode.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Input from '@/components/shared/ui/Input.svelte';
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import { settingsStore, saveSettings } from '@/scripts/settings/settings';
	import { t } from '@/i18n';

	async function handleRestart() {
		if (confirm($t('settings.advanced.restartConfirm'))) {
			if ($settingsStore) {
				await saveSettings($settingsStore);
				window.electronAPI.restartUI();
			}
		}
	}
</script>

{#if $settingsStore}
	<SettingItem
		label={$t('settings.advanced.useNativeWayland')}
		id="nativeWayland"
		description={$t('settings.advanced.useNativeWaylandDesc')}
	>
		<Toggle
			id="nativeWayland"
			bind:checked={$settingsStore.nativeWayland}
			onChange={handleRestart}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.advanced.enableCustomArgs')}
		id="customArgsEnabled"
	>
		<Toggle
			id="customArgsEnabled"
			bind:checked={$settingsStore.customArgsEnabled}
		/>
	</SettingItem>

	{#if $settingsStore.customArgsEnabled}
		<SettingItem
			label={$t('settings.advanced.customCommandArgs')}
			id="customArgs"
			vertical
			description={$t('settings.advanced.customCommandArgsDesc')}
		>
			<Input
				type="text"
				id="customArgs"
				bind:value={$settingsStore.customArgs}
				placeholder={$t('settings.advanced.customArgsPlaceholder')}
			/>
			<div class="doc-actions">
				<Button
					variant="ghost"
					on:click={() =>
						window.electronAPI.openExternal(
							'https://github.com/Almamu/linux-wallpaperengine?tab=readme-ov-file#-common-options'
						)}
				>
					<Icon name="open_in_new" size={14} />
					<span>{$t('settings.advanced.commonOptionsDoc')}</span>
				</Button>
			</div>
		</SettingItem>
	{/if}

	<!-- Hooks: add more hook items below as needed -->
	<SettingItem label={$t('settings.advanced.enableHooks')} id="hookEnabled" description={$t('settings.advanced.enableHooksDesc')}>
		<Toggle id="hookEnabled" bind:checked={$settingsStore.hookEnabled} />
	</SettingItem>

	{#if $settingsStore.hookEnabled}
		<SettingItem
			label={$t('settings.advanced.wallpaperChangeCommand')}
			id="wallpaperChangeCommand"
			vertical
			description={$t('settings.advanced.wallpaperChangeCommandDesc')}
		>
			<div class="table-container">
				<table class="variable-table">
					<thead>
						<tr>
							<th>Variable</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<CopyableCode code="$PREVIEW_PATH" />
							</td>
							<td>Absolute path to the wallpaper's preview image.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$VIDEO_PATH" />
							</td>
							<td>Absolute path to the main media file (video/html).</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$IS_VIDEO" />
							</td>
							<td>Boolean indicating if wallpaper is video.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_TITLE" />
							</td>
							<td>Display name or title of the wallpaper.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_TYPE" />
							</td>
							<td>Type of the wallpaper (video, web, scene).</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$WALLPAPER_ID" />
							</td>
							<td>Unique Steam Workshop ID.</td>
						</tr>
						<tr>
							<td>
								<CopyableCode code="$SCREEN_NAME" />
							</td>
							<td>Monitor/screen name (e.g., DP-1).</td>
						</tr>
					</tbody>
				</table>
			</div>
			<Input
				id="wallpaperChangeCommand"
				bind:value={$settingsStore.wallpaperChangeCommand}
				placeholder="e.g. matugen image '$PREVIEW_PATH' -j"
			/>
		</SettingItem>
	{/if}
{/if}

<style lang="scss">
	.table-container {
		width: 100%;
		overflow-x: auto;
		margin-bottom: 12px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.variable-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85em;

		th,
		td {
			padding: 10px 14px;
			text-align: left;
			border-bottom: 1px solid var(--border-color);
		}

		th {
			font-weight: 600;
			color: var(--text-color);
		}

		tr:last-child td {
			border-bottom: none;
		}
	}
</style>
