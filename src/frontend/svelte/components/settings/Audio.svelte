<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Range from '@/components/shared/ui/Range.svelte';
	import { settingsStore } from '@/scripts/settings/settings';
</script>

{#if $settingsStore}
	<SettingItem
		label="Silence Wallpaper"
		id="silence"
		description="Mute all audio output."
	>
		<Toggle
			id="silence"
			bind:checked={$settingsStore.silence}
		/>
	</SettingItem>

	{#if !$settingsStore.silence}
		<SettingItem
			label="Volume"
			id="volume"
			description="Adjust master volume level."
		>
			<Range
				id="volume"
				bind:value={$settingsStore.volume}
				min={0}
				max={100}
			/>
		</SettingItem>

		<SettingItem
			label="No Automute"
			id="noAutomute"
			description="Prevent automatic muting when not in focus."
		>
			<Toggle
				id="noAutomute"
				bind:checked={$settingsStore.noAutomute}
			/>
		</SettingItem>

		<SettingItem
			label="No Audio Processing"
			id="noAudioProcessing"
			description="Disable audio analysis features."
		>
			<Toggle
				id="noAudioProcessing"
				bind:checked={$settingsStore.noAudioProcessing}
			/>
		</SettingItem>
	{/if}
{/if}
