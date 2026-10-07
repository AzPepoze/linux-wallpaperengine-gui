<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import Select from '@/ui/Select.svelte';
	import Range from '@/ui/Range.svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore, saveSettings, handleAutostart } from '@/features/settings/scripts/settings';
	import { t, locale, setLocale, availableLocales } from '@/core/i18n';

	const langOptions = availableLocales;

	function handleLanguageChange(code: string) {
		setLocale(code);
		settingsStore.update((s) => (s ? { ...s, language: code } : s));
		window.electronAPI.setLanguage(code);
	}

	async function handleRestart() {
		if (confirm($t('playlist.messages.restartRequired'))) {
			if ($settingsStore) {
				await saveSettings($settingsStore);
				window.electronAPI.restartUI();
			}
		}
	}
</script>

{#if $settingsStore}
	<SettingItem
		label={$t('settings.general.language')}
		id="language"
		description={$t('settings.general.languageDesc')}
	>
		<Select
			id="language"
			bind:value={$locale}
			options={langOptions}
			onChange={handleLanguageChange}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.autostart')}
		id="autostart"
		description={$t('settings.general.autostartDesc')}
	>
		<Toggle
			id="autostart"
			bind:checked={$settingsStore.autostart}
			onChange={() => handleAutostart($settingsStore.autostart)}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.dynamicTheme')}
		id="dynamicUiTheme"
		description={$t('settings.general.dynamicThemeDesc')}
	>
		<Toggle
			id="dynamicUiTheme"
			bind:checked={$settingsStore.dynamicUiTheme}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.dynamicSidebarTheme')}
		id="dynamicSidebarTheme"
		description={$t('settings.general.dynamicSidebarThemeDesc')}
	>
		<Toggle
			id="dynamicSidebarTheme"
			bind:checked={$settingsStore.dynamicSidebarTheme}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.transparentUi')}
		id="transparentUi"
		description={$t('settings.general.transparentUiDesc')}
	>
		<Toggle
			id="transparentUi"
			bind:checked={$settingsStore.transparentUi}
			onChange={handleRestart}
		/>
	</SettingItem>

	{#if $settingsStore.transparentUi}
		<div 
			transition:slide={{ duration: 300 }}
			style="display: flex; flex-direction: column; gap: 16px;"
		>
			<SettingItem
				label={$t('settings.general.uiTransparency')}
				id="uiTransparency"
				description={$t('settings.general.uiTransparencyDesc')}
			>
				<Range
					id="uiTransparency"
					bind:value={$settingsStore.uiTransparency}
					min={10}
					max={100}
					step={5}
				/>
			</SettingItem>
		</div>
	{/if}

	<SettingItem
		label={$t('settings.general.scrollMask')}
		id="enableScrollMask"
		description={$t('settings.general.scrollMaskDesc')}
	>
		<Toggle
			id="enableScrollMask"
			bind:checked={$settingsStore.enableScrollMask}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.hideTrayLabel')}
		id="hideTrayLabel"
		description={$t('settings.general.hideTrayLabelDesc')}
	>
		<Toggle
			id="hideTrayLabel"
			bind:checked={$settingsStore.hideTrayLabel}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.gridWarpAnimation')}
		id="enableGridWarpAnimation"
		description={$t('settings.general.gridWarpAnimationDesc')}
	>
		<Toggle
			id="enableGridWarpAnimation"
			bind:checked={$settingsStore.enableGridWarpAnimation}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.performanceMode')}
		id="performanceMode"
		description={$t('settings.general.performanceModeDesc')}
	>
		<Toggle
			id="performanceMode"
			bind:checked={$settingsStore.performanceMode}
		/>
	</SettingItem>
{/if}
