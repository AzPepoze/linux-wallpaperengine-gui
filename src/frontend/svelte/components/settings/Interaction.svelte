<script lang="ts">
	import SettingItem from '@/components/shared/ui/SettingItem.svelte';
	import Toggle from '@/components/shared/ui/Toggle.svelte';
	import { settingsStore } from '@/scripts/settings/settings';
</script>

{#if $settingsStore}
	<SettingItem
		label="Disable Mouse"
		id="disableMouse"
		description="Ignore mouse movement and clicks."
	>
		<Toggle
			id="disableMouse"
			bind:checked={$settingsStore.disableMouse}
		/>
	</SettingItem>

	<SettingItem
		label="Disable Parallax"
		id="disableParallax"
		description="Turn off mouse-following parallax effects."
	>
		<Toggle
			id="disableParallax"
			bind:checked={$settingsStore.disableParallax}
		/>
	</SettingItem>
{/if}
