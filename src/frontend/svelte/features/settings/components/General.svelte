<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import Input from '@/ui/Input.svelte';
	import Select from '@/ui/Select.svelte';
	import Range from '@/ui/Range.svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore, saveSettings, handleAutostart } from '@/features/settings/scripts/settings';
	import { t, locale, setLocale } from '@/core/i18n';

	const langOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'zh', label: '中文' }
	];

	$: scalingOptions = [
		{ value: 'default', label: $t('settings.generalScaling.default') },
		{ value: 'stretch', label: $t('settings.generalScaling.stretch') },
		{ value: 'fit', label: $t('settings.generalScaling.fit') },
		{ value: 'fill', label: $t('settings.generalScaling.fill') }
	];

	$: clampingOptions = [
		{ value: 'clamp', label: $t('settings.generalClamping.clamp') },
		{ value: 'border', label: $t('settings.generalClamping.border') },
		{ value: 'repeat', label: $t('settings.generalClamping.repeat') }
	];

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
			onChange={(v) => setLocale(v)}
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
		label={$t('settings.general.fpsLimit')}
		id="fps"
		description={$t('settings.general.fpsLimitDesc')}
	>
		<Input
			type="number"
			id="fps"
			bind:value={$settingsStore.fps}
			min={1}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.scalingMode')}
		id="scaling"
		description={$t('settings.general.scalingModeDesc')}
	>
		<Select
			id="scaling"
			bind:value={$settingsStore.scaling}
			options={scalingOptions}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.clampingMode')}
		id="clamping"
		description={$t('settings.general.clampingModeDesc')}
	>
		<Select
			id="clamping"
			bind:value={$settingsStore.clamping}
			options={clampingOptions}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.noFullscreenPause')}
		id="noFullscreenPause"
		description={$t('settings.general.noFullscreenPauseDesc')}
	>
		<Toggle
			id="noFullscreenPause"
			bind:checked={$settingsStore.noFullscreenPause}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.disableParticles')}
		id="disableParticles"
		description={$t('settings.general.disableParticlesDesc')}
	>
		<Toggle
			id="disableParticles"
			bind:checked={$settingsStore.disableParticles}
		/>
	</SettingItem>

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
{/if}
