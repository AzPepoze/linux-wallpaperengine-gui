<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import Range from '@/components/shared/ui/Range.svelte';
	import { settingsStore } from '@/scripts/settings/settings';
	import { t } from '@/i18n';
</script>

{#if $settingsStore}
	<SettingItem
		label={$t('settings.audio.silenceWallpaper')}
		id="silence"
		description={$t('settings.audio.silenceWallpaperDesc')}
	>
		<Toggle
			id="silence"
			bind:checked={$settingsStore.silence}
		/>
	</SettingItem>

	{#if !$settingsStore.silence}
		<SettingItem
			label={$t('settings.audio.volume')}
			id="volume"
			description={$t('settings.audio.volumeDesc')}
		>
			<Range
				id="volume"
				bind:value={$settingsStore.volume}
				min={0}
				max={100}
			/>
		</SettingItem>

		<SettingItem
			label={$t('settings.audio.noAutomute')}
			id="noAutomute"
			description={$t('settings.audio.noAutomuteDesc')}
		>
			<Toggle
				id="noAutomute"
				bind:checked={$settingsStore.noAutomute}
			/>
		</SettingItem>

		<SettingItem
			label={$t('settings.audio.noAudioProcessing')}
			id="noAudioProcessing"
			description={$t('settings.audio.noAudioProcessingDesc')}
		>
			<Toggle
				id="noAudioProcessing"
				bind:checked={$settingsStore.noAudioProcessing}
			/>
		</SettingItem>
	{/if}
{/if}
