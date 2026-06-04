<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { t } from '@/core/i18n';
</script>

{#if $settingsStore}
	<SettingItem
		label={$t('settings.interaction.disableMouse')}
		id="disableMouse"
		description={$t('settings.interaction.disableMouseDesc')}
	>
		<Toggle
			id="disableMouse"
			bind:checked={$settingsStore.disableMouse}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.interaction.disableParallax')}
		id="disableParallax"
		description={$t('settings.interaction.disableParallaxDesc')}
	>
		<Toggle
			id="disableParallax"
			bind:checked={$settingsStore.disableParallax}
		/>
	</SettingItem>
{/if}
