<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Input from '@/components/shared/ui/Input.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
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
{/if}
