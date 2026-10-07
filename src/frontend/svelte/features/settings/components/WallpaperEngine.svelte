<script lang="ts">
	import SettingItem from '@/ui/SettingItem.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import Input from '@/ui/Input.svelte';
	import Select from '@/ui/Select.svelte';
	import ListEditor from '@/ui/ListEditor.svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import { t } from '@/core/i18n';

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

	$: layerOptions = [
		{ value: 'bottom', label: $t('settings.generalLayer.bottom') },
		{ value: 'background', label: $t('settings.generalLayer.background') },
		{ value: 'top', label: $t('settings.generalLayer.top') },
		{ value: 'overlay', label: $t('settings.generalLayer.overlay') }
	];

	// Named Wallpaper Engine transition effects (engine effect names). Labels are
	// proper nouns and intentionally not translated.
	const effectNames: { value: string; label: string }[] = [
		{ value: 'fade', label: 'Fade' },
		{ value: 'mosaic', label: 'Mosaic' },
		{ value: 'diffuse', label: 'Diffuse' },
		{ value: 'horizontal_slide', label: 'Horizontal Slide' },
		{ value: 'vertical_slide', label: 'Vertical Slide' },
		{ value: 'horizontal_fade', label: 'Horizontal Fade' },
		{ value: 'vertical_fade', label: 'Vertical Fade' },
		{ value: 'clouds', label: 'Clouds' },
		{ value: 'burnt_paper', label: 'Burnt Paper' },
		{ value: 'circular', label: 'Circular' },
		{ value: 'zipper', label: 'Zipper' },
		{ value: 'door', label: 'Door' },
		{ value: 'lines', label: 'Lines' },
		{ value: 'zoom', label: 'Zoom' },
		{ value: 'drip', label: 'Drip' },
		{ value: 'pixelate', label: 'Pixelate' },
		{ value: 'bricks', label: 'Bricks' },
		{ value: 'paint', label: 'Paint' },
		{ value: 'fade_to_black', label: 'Fade to Black' },
		{ value: 'twister', label: 'Twister' },
		{ value: 'black_hole', label: 'Black Hole' },
		{ value: 'crt', label: 'CRT' },
		{ value: 'radial_wipe', label: 'Radial Wipe' },
		{ value: 'glass_shatter', label: 'Glass Shatter' },
		{ value: 'bullets', label: 'Bullets' },
		{ value: 'ice', label: 'Ice' },
		{ value: 'boilover', label: 'Boilover' }
	];

	$: transitionEffectOptions = [
		{ value: '', label: $t('settings.general.transitionEffectDefault') },
		{ value: 'none', label: $t('settings.general.transitionEffectNone') },
		{ value: 'random', label: $t('settings.general.transitionEffectRandom') },
		...effectNames
	];

	$: transitionModeOptions = [
		{ value: '', label: $t('settings.general.transitionModeDefault') },
		{ value: 'freeze', label: $t('settings.general.transitionModeFreeze') },
		{ value: 'continue', label: $t('settings.general.transitionModeContinue') }
	];
</script>

{#if $settingsStore}
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
		label={$t('settings.general.layer')}
		id="layer"
		description={$t('settings.general.layerDesc')}
	>
		<Select
			id="layer"
			bind:value={$settingsStore.layer}
			options={layerOptions}
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

	{#if !$settingsStore.noFullscreenPause}
		<div
			transition:slide={{ duration: 300 }}
			style="display: flex; flex-direction: column; gap: 16px;"
		>
			<SettingItem
				label={$t('settings.general.fullscreenPauseOnlyActive')}
				id="fullscreenPauseOnlyActive"
				description={$t('settings.general.fullscreenPauseOnlyActiveDesc')}
			>
				<Toggle
					id="fullscreenPauseOnlyActive"
					bind:checked={$settingsStore.fullscreenPauseOnlyActive}
				/>
			</SettingItem>

			<SettingItem
				label={$t('settings.general.fullscreenPauseIgnoreAppIds')}
				id="fullscreenPauseIgnoreAppIds"
				vertical
				description={$t('settings.general.fullscreenPauseIgnoreAppIdsDesc')}
			>
				<ListEditor
					items={$settingsStore.fullscreenPauseIgnoreAppIds || []}
					placeholder={$t('settings.general.fullscreenPauseIgnoreAppIdsPlaceholder')}
					on:change={(e) => {
						if ($settingsStore) {
							$settingsStore.fullscreenPauseIgnoreAppIds = e.detail;
						}
					}}
				/>
			</SettingItem>
		</div>
	{/if}

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
		label={$t('settings.general.transitionEffect')}
		id="transition"
		description={$t('settings.general.transitionEffectDesc')}
	>
		<Select
			id="transition"
			bind:value={$settingsStore.transition}
			options={transitionEffectOptions}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.transitionDuration')}
		id="transitionDuration"
		description={$t('settings.general.transitionDurationDesc')}
	>
		<Input
			type="number"
			id="transitionDuration"
			bind:value={$settingsStore.transitionDuration}
			min={0}
		/>
	</SettingItem>

	<SettingItem
		label={$t('settings.general.transitionMode')}
		id="transitionMode"
		description={$t('settings.general.transitionModeDesc')}
	>
		<Select
			id="transitionMode"
			bind:value={$settingsStore.transitionMode}
			options={transitionModeOptions}
		/>
	</SettingItem>
{/if}
