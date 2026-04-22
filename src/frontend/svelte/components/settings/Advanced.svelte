<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Input from '@/components/shared/ui/Input.svelte';
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';
	import { settingsStore, saveSettings } from '@/scripts/settings/settings';

	async function handleRestart() {
		if (confirm('Changing Wayland support requires a restart. Do you want to restart now?')) {
			if ($settingsStore) {
				await saveSettings($settingsStore);
				window.electronAPI.restartUI();
			}
		}
	}
</script>

{#if $settingsStore}
	<SettingItem
		label="Use Native Wayland"
		id="nativeWayland"
		description="Run the GUI with native Wayland support (requires restart)."
	>
		<Toggle
			id="nativeWayland"
			bind:checked={$settingsStore.nativeWayland}
			onChange={handleRestart}
		/>
	</SettingItem>

	<SettingItem
		label="Enable Custom Arguments"
		id="customArgsEnabled"
	>
		<Toggle
			id="customArgsEnabled"
			bind:checked={$settingsStore.customArgsEnabled}
		/>
	</SettingItem>

	{#if $settingsStore.customArgsEnabled}
		<SettingItem
			label="Custom Command Args"
			id="customArgs"
			vertical
			description="Pass raw arguments to the backend."
		>
			<Input
				type="text"
				id="customArgs"
				bind:value={$settingsStore.customArgs}
				placeholder="e.g. --window 0x0x1920x1080"
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
					<span>Common Options Documentation</span>
				</Button>
			</div>
		</SettingItem>
	{/if}
{/if}
