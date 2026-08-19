<script lang="ts">
	import Button from '@/ui/Button.svelte';
	import CopyableCode from '@/ui/CopyableCode.svelte';
	import Icon from '@/ui/Icon.svelte';
	import Input from '@/ui/Input.svelte';
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore, saveSettings } from '@/features/settings/scripts/settings';
	import { t } from '@/core/i18n';

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
		<div 
			transition:slide={{ duration: 300 }}
			style="display: flex; flex-direction: column; gap: 16px;"
		>
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
		</div>
	{/if}

	<!-- Hooks: add more hook items below as needed -->
	<SettingItem label={$t('settings.advanced.enableHooks')} id="hookEnabled" description={$t('settings.advanced.enableHooksDesc')}>
		<Toggle id="hookEnabled" bind:checked={$settingsStore.hookEnabled} />
	</SettingItem>

	{#if $settingsStore.hookEnabled}
		<div 
			transition:slide={{ duration: 300 }}
			style="display: flex; flex-direction: column; gap: 16px;"
		>
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
								<th>{$t('settings.advanced.hooks.variable')}</th>
								<th>{$t('settings.advanced.hooks.description')}</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<CopyableCode code="$PREVIEW_PATH" />
								</td>
								<td>{$t('settings.advanced.hooks.previewPathDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$VIDEO_PATH" />
								</td>
								<td>{$t('settings.advanced.hooks.videoPathDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$IS_VIDEO" />
								</td>
								<td>{$t('settings.advanced.hooks.isVideoDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$WALLPAPER_TITLE" />
								</td>
								<td>{$t('settings.advanced.hooks.wallpaperTitleDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$WALLPAPER_TYPE" />
								</td>
								<td>{$t('settings.advanced.hooks.wallpaperTypeDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$WALLPAPER_ID" />
								</td>
								<td>{$t('settings.advanced.hooks.wallpaperIdDesc')}</td>
							</tr>
							<tr>
								<td>
									<CopyableCode code="$SCREEN_NAME" />
								</td>
								<td>{$t('settings.advanced.hooks.screenNameDesc')}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<Input
					id="wallpaperChangeCommand"
					bind:value={$settingsStore.wallpaperChangeCommand}
					placeholder={$t('settings.advanced.hooks.commandPlaceholder')}
				/>
			</SettingItem>
		</div>
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
