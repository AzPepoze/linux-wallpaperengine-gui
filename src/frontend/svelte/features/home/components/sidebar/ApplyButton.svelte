<script lang="ts">
	import { t } from '@/core/i18n';
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';
	import { applyWallpaper } from '@/features/wallpaper/scripts/applyWallpaper';
	import { screens, selectedScreen, cloneMode, spanMode } from '@/features/home/scripts/display';

	export let folderName: string;

	$: screenNames = Object.keys($screens);
	$: isUnified = $cloneMode || $spanMode;
	$: label = getApplyLabel(screenNames, isUnified, $selectedScreen);

	function getApplyLabel(names: string[], unified: boolean, selected: string | null): string {
		if (names.length <= 1) return $t('sidebar.apply');
		if (unified) return $t('sidebar.applyAll');
		return $t('sidebar.applyTo', { screen: selected || names[0] });
	}
</script>

<Button
	variant="primary"
	on:click={() => applyWallpaper(folderName)}
	style="width: 100%; height: 40px; border-radius: 25px;"
>
	<Icon name="desktop_windows" size={18} color="inherit" />
	{label}
</Button>
