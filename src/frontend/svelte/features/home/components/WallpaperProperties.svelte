<script lang="ts">
	import type { WallpaperProperty } from '@shared/types';
	import { settingsStore } from '@/features/settings/scripts/settings';
	import ColorPicker from '@/ui/ColorPicker.svelte';
	import Select from '@/ui/Select.svelte';
	import Toggle from '@/ui/Toggle.svelte';
	import Range from '@/ui/Range.svelte';
	import Icon from '@/ui/Icon.svelte';
	import {
		parseProperties,
		renderMarkdown,
		getLabelParts
	} from './WallpaperProperties.svelte.ts';
	import { t } from '@/core/i18n';

	export let wallpaperId: string;
	export let textColor: string = 'var(--text-color)';
	export let palette: [number, number, number][] = [];

	// Controls that fit beside the label; the rest get their own line
	const inlineTypes: string[] = ['boolean', 'combolist'];

	let properties: WallpaperProperty[] = [];
	let loading = true;

	$: currentWallpaperProperties =
		$settingsStore?.wallpaperProperties?.[wallpaperId] || {};

	// Saved values are passed in so the template re-runs when they change
	function getPropertyValue(prop: WallpaperProperty, saved: Record<string, any>) {
		const savedValue = saved[prop.name];
		if (savedValue !== undefined) {
			return savedValue;
		}
		return prop.value;
	}

	function isStacked(prop: WallpaperProperty, label: string, header: string) {
		return header.length > 0 || label.length > 30 || !inlineTypes.includes(prop.type);
	}

	async function fetchProperties() {
		loading = true;
		properties = [];

		try {
			// Try to fetch detailed project data (from project.json) first
			const result =
				await window.electronAPI.getWallpaperProjectData(
					wallpaperId
				);
			if (result.success && result.properties) {
				properties = parseProperties(result.properties);
			} else {
				// Fallback to CLI parsing if needed
				properties =
					await window.electronAPI.getWallpaperProperties(
						wallpaperId
					);
			}
		} catch (e) {
			console.error('Failed to load properties:', e);
		} finally {
			loading = false;
		}
	}

	$: if (wallpaperId) {
		fetchProperties();
	}

	async function updateProperty(name: string, value: any) {
		let stringValue = String(value);
		if (typeof value === 'boolean') {
			stringValue = value ? '1' : '0';
		}

		settingsStore.update((s) => {
			if (!s) return s;
			const newS = { ...s };
			if (!newS.wallpaperProperties) newS.wallpaperProperties = {};
			if (!newS.wallpaperProperties[wallpaperId])
				newS.wallpaperProperties[wallpaperId] = {};
			newS.wallpaperProperties[wallpaperId][name] = stringValue;
			return newS;
		});

		await window.electronAPI.saveWallpaperProperty(
			wallpaperId,
			name,
			stringValue
		);
	}

	function handleToggle(name: string, value: boolean) {
		updateProperty(name, value);
	}

	function handleRange(name: string, event: Event) {
		const target = event.target as HTMLInputElement;
		updateProperty(name, target.value);
	}

	function handleSelect(name: string, value: string) {
		updateProperty(name, value);
	}

	function hasSavedValue(name: string, saved: Record<string, any>) {
		return saved[name] !== undefined;
	}

	$: hasSavedValues = Object.keys(currentWallpaperProperties).length > 0;

	async function resetProperty(name: string) {
		settingsStore.update((s) => {
			if (!s?.wallpaperProperties?.[wallpaperId]) return s;
			const { [name]: _, ...rest } = s.wallpaperProperties[wallpaperId];
			return {
				...s,
				wallpaperProperties: { ...s.wallpaperProperties, [wallpaperId]: rest }
			};
		});

		await window.electronAPI.resetWallpaperProperty(wallpaperId, name);
	}

	async function resetAll() {
		settingsStore.update((s) => {
			if (!s?.wallpaperProperties) return s;
			const { [wallpaperId]: _, ...rest } = s.wallpaperProperties;
			return { ...s, wallpaperProperties: rest };
		});

		await window.electronAPI.resetWallpaperProperties(wallpaperId);
	}
</script>

<div class="properties" style="color: {textColor}">
	{#if hasSavedValues && !loading}
		<div class="reset-all-row">
			<button type="button" class="reset-all-btn" on:click={resetAll}>
				<Icon name="restart_alt" size={16} />
				<span>Reset all</span>
			</button>
		</div>
	{/if}

	{#if loading}
		<p class="status-msg">{$t('wallpaper.properties.loading')}</p>
	{:else if properties.length === 0}
		<p class="status-msg">{$t('wallpaper.properties.noConfigurable')}</p>
	{:else}
		<div class="prop-list">
			{#each properties as prop}
				{#if prop.type === 'group' || prop.type === 'text'}
					<div class="note">
						{@html renderMarkdown(
							prop.description || prop.value || ''
						)}
					</div>
				{:else}
					{@const { header, label, isPureHeader } =
						getLabelParts(prop)}

					{#if header}
						<div class="external-header">
							{@html renderMarkdown(header)}
						</div>
					{/if}

					{#if !isPureHeader && (label || prop.name === 'schemecolor')}
						<div
							class="prop-row"
							class:stacked={isStacked(prop, label, header)}
						>
							<div class="prop-label">
								{@html renderMarkdown(
									label ||
										(prop.name !== 'schemecolor'
											? prop.name
											: '')
								)}
							</div>
							<div class="prop-control">
								{#if prop.type === 'slider'}
									<Range
										id="prop-{wallpaperId}-{prop.name}"
										min={prop.min ?? 0}
										max={prop.max ?? 1}
										step={prop.step ?? 0.01}
										value={parseFloat(
											getPropertyValue(prop, currentWallpaperProperties)
										)}
										on:input={(e) =>
											handleRange(prop.name, e)}
									/>
								{:else if prop.type === 'boolean'}
									<Toggle
										id="prop-{wallpaperId}-{prop.name}"
										checked={getPropertyValue(prop, currentWallpaperProperties) ===
											'1' ||
											getPropertyValue(prop, currentWallpaperProperties) ===
												'true' ||
											getPropertyValue(prop, currentWallpaperProperties) ===
												true}
										onChange={(val) =>
											handleToggle(prop.name, val)}
									/>
								{:else if prop.type === 'combolist'}
									<Select
										id="prop-{wallpaperId}-{prop.name}"
										value={getPropertyValue(prop, currentWallpaperProperties)}
										options={Object.entries(
											prop.options || {}
										).map(([label, value]) => ({
											label,
											value
										}))}
										onChange={(val) =>
											handleSelect(prop.name, val)}
									/>
								{:else if prop.type === 'color'}
									<ColorPicker
										value={getPropertyValue(prop, currentWallpaperProperties)}
										onInput={(val) =>
											updateProperty(
												prop.name,
												val
											)}
										{palette}
									/>
								{:else}
									<input
										type="text"
										value={getPropertyValue(prop, currentWallpaperProperties)}
										on:change={(e) =>
											updateProperty(
												prop.name,
												(
													e.currentTarget as HTMLInputElement
												).value
											)}
										class="text-input"
									/>
								{/if}
							</div>
							<button
								type="button"
								class="reset-btn"
								class:invisible={!hasSavedValue(prop.name, currentWallpaperProperties)}
								title="Reset to default"
								aria-label="Reset to default"
								on:click={() => resetProperty(prop.name)}
							>
								<Icon name="restart_alt" size={16} />
							</button>
						</div>
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.properties {
		.reset-all-row {
			display: flex;
			justify-content: flex-end;
			margin-bottom: 4px;
		}

		.reset-all-btn,
		.reset-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			background: transparent;
			border: 1px solid transparent;
			color: var(--text-muted);
			cursor: pointer;
			transition: var(--transition-base);

			&:hover {
				color: var(--text-color);
			}

			&:focus-visible {
				outline: 2px solid var(--btn-primary-bg);
				outline-offset: 2px;
			}
		}

		.reset-all-btn {
			padding: 4px 10px;
			font-size: 0.85rem;
			border-color: var(--border-color);
			border-radius: var(--radius-full);

			&:hover {
				border-color: var(--border-color-hover);
				background: var(--bg-surface-hover);
			}
		}

		.reset-btn {
			flex: 0 0 auto;
			width: 28px;
			height: 28px;
			padding: 0;
			border-radius: var(--radius-sm);

			&:hover {
				background: var(--bg-surface-hover);
			}

			// Keeps its space when there is nothing to reset, so controls do not shift
			&.invisible {
				visibility: hidden;
			}
		}

		.status-msg {
			margin: 0;
			padding: 8px 0;
			font-size: 0.9em;
			font-style: italic;
			color: var(--text-muted);
		}

		.prop-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 12px 0;
			border-bottom: 1px solid var(--border-color);

			&:last-child {
				border-bottom: none;
			}

			// Label on top; control on the left and reset button on the right
			&.stacked {
				display: grid;
				grid-template-columns: minmax(0, 1fr) auto;
				align-items: center;
				gap: 10px 8px;

				> .prop-label {
					grid-column: 1 / -1;
				}

				> .prop-control {
					grid-column: 1;
					width: 100%;
				}

				> .reset-btn {
					grid-column: 2;
				}
			}
		}

		.prop-label {
			flex: 1;
			min-width: 0;
			font-size: 0.92em;
			font-weight: 500;
			line-height: 1.45;

			:global(p) {
				margin: 0;
				display: inline;
			}
		}

		.prop-control {
			display: flex;
			align-items: center;
			flex: 0 0 auto;
			min-width: 0;
		}

		.external-header {
			margin: 12px 0 4px;
			width: 100%;

			:global(p) {
				margin: 0.5em 0;
			}

			:global(h1),
			:global(h2),
			:global(h3),
			:global(h4) {
				margin: 15px 0 8px 0;
				color: var(--text-color);
				font-weight: 700;
				font-size: 1.4em;
			}

			:global(hr) {
				border: none;
				border-top: 1px solid var(--border-color);
				margin: 20px 0;
				display: block;
				width: 100%;
				opacity: 0.8;
			}

			:global(img) {
				max-width: 100%;
				height: auto !important;
				border-radius: var(--radius-sm);
				display: block;
				margin: 10px 0;
			}

			:global(a) {
				color: var(--btn-primary-bg);
				text-decoration: underline;
				&:hover {
					color: var(--btn-primary-hover-bg);
				}
			}
		}

		.note {
			padding: 8px 0 12px;
			font-size: 0.92em;
			line-height: 1.6;

			:global(img) {
				max-width: 100%;
				height: auto !important;
				border-radius: var(--radius-sm);
				margin: 10px 0;
				display: block;
			}

			:global(h1),
			:global(h2),
			:global(h3),
			:global(h4) {
				margin-top: 1.5em;
				margin-bottom: 0.5em;
				color: var(--text-color);
			}

			:global(b),
			:global(strong) {
				color: var(--text-color);
				font-weight: 700;
			}

			:global(big),
			:global(.big-text) {
				font-size: 1.25em;
				font-weight: 600;
				display: block;
				margin: 10px 0;
			}

			:global(hr) {
				border: none;
				border-top: 1px solid var(--border-color);
				margin: 20px 0;
				display: block;
			}
		}

		.text-input {
			background: var(--bg-surface-active);
			border: 1px solid var(--border-color);
			color: inherit;
			padding: 8px 12px;
			border-radius: var(--radius-sm);
			width: 100%;
			font-size: 0.9em;
			outline: none;
			transition: var(--transition-base);

			&:focus {
				border-color: var(--btn-primary-bg);
			}
		}
	}
</style>
