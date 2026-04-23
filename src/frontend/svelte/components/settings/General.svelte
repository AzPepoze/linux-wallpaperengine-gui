<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Input from '@/components/shared/ui/Input.svelte';
	import Select from '@/components/shared/ui/Select.svelte';
	import Range from '@/components/shared/ui/Range.svelte';
	import { settingsStore, saveSettings, handleAutostart } from '@/scripts/settings/settings';

	const scalingOptions = [
		{ value: 'default', label: 'Default' },
		{ value: 'stretch', label: 'Stretch' },
		{ value: 'fit', label: 'Fit' },
		{ value: 'fill', label: 'Fill' }
	];

	const clampingOptions = [
		{ value: 'clamp', label: 'Clamp' },
		{ value: 'border', label: 'Border' },
		{ value: 'repeat', label: 'Repeat' }
	];

	async function handleRestart() {
		if (confirm('Changing this setting requires a restart. Do you want to restart now?')) {
			if ($settingsStore) {
				await saveSettings($settingsStore);
				window.electronAPI.restartUI();
			}
		}
	}
</script>

{#if $settingsStore}
	<SettingItem
		label="Run on system startup"
		id="autostart"
		description="Run this GUI to apply wallpapers in the background on system startup."
	>
		<Toggle
			id="autostart"
			bind:checked={$settingsStore.autostart}
			onChange={() => handleAutostart($settingsStore.autostart)}
		/>
	</SettingItem>

	<SettingItem
		label="Dynamic UI Theme"
		id="dynamicUiTheme"
		description="Adapt application colors to match the currently selected wallpaper."
	>
		<Toggle
			id="dynamicUiTheme"
			bind:checked={$settingsStore.dynamicUiTheme}
		/>
	</SettingItem>

	<SettingItem
		label="Dynamic Sidebar Theme"
		id="dynamicSidebarTheme"
		description="Apply wallpaper colors locally to the sidebar directly."
	>
		<Toggle
			id="dynamicSidebarTheme"
			bind:checked={$settingsStore.dynamicSidebarTheme}
		/>
	</SettingItem>

	<SettingItem
		label="Transparent UI"
		id="transparentUi"
		description="Make the window background transparent (requires restart)."
	>
		<Toggle
			id="transparentUi"
			bind:checked={$settingsStore.transparentUi}
			onChange={handleRestart}
		/>
	</SettingItem>

	{#if $settingsStore.transparentUi}
		<SettingItem
			label="UI Transparency Level"
			id="uiTransparency"
			description="Adjust the opacity of the application."
		>
			<Range
				id="uiTransparency"
				bind:value={$settingsStore.uiTransparency}
				min={10}
				max={100}
				step={5}
			/>
		</SettingItem>
	{/if}

	<SettingItem
		label="FPS Limit"
		id="fps"
		description="Target frames per second for animations."
	>
		<Input
			type="number"
			id="fps"
			bind:value={$settingsStore.fps}
			min={1}
		/>
	</SettingItem>

	<SettingItem
		label="Scaling Mode"
		id="scaling"
		description="How the wallpaper fits the screen."
	>
		<Select
			id="scaling"
			bind:value={$settingsStore.scaling}
			options={scalingOptions}
		/>
	</SettingItem>

	<SettingItem
		label="Clamping Mode"
		id="clamping"
		description="Texture wrapping behavior."
	>
		<Select
			id="clamping"
			bind:value={$settingsStore.clamping}
			options={clampingOptions}
		/>
	</SettingItem>

	<SettingItem
		label="No Fullscreen Pause"
		id="noFullscreenPause"
		description="Keep running when other apps are fullscreen."
	>
		<Toggle
			id="noFullscreenPause"
			bind:checked={$settingsStore.noFullscreenPause}
		/>
	</SettingItem>

	<SettingItem
		label="Disable Particles"
		id="disableParticles"
		description="Turn off particle effects to save resources."
	>
		<Toggle
			id="disableParticles"
			bind:checked={$settingsStore.disableParticles}
		/>
	</SettingItem>

	<SettingItem
		label="Scroll Mask Effect"
		id="enableScrollMask"
		description="Enable smooth fade effect at the top and bottom of scroll areas. (Note: May impact performance on some systems)"
	>
		<Toggle
			id="enableScrollMask"
			bind:checked={$settingsStore.enableScrollMask}
		/>
	</SettingItem>
{/if}
