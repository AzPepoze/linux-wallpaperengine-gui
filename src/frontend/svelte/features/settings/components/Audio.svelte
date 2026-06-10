<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import Range from '@/ui/Range.svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { t } from '@/core/i18n';
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
		<div 
			transition:slide={{ duration: 300 }} 
			style="display: flex; flex-direction: column; gap: 16px;"
		>
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
		</div>
	{/if}
{/if}
