<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import type {
		WallpaperProperty,
		PropertyType
	} from '../../../shared/types';
	import { settingsStore } from '../../scripts/settings';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import Select from '../ui/Select.svelte';
	import SettingItem from '../ui/SettingItem.svelte';
	import Toggle from '../ui/Toggle.svelte';
	import Range from '../ui/Range.svelte';

	export let wallpaperId: string;
	export let textColor: string = 'var(--text-color)';
	export let palette: [number, number, number][] = [];

	let properties: WallpaperProperty[] = [];
	let loading = true;

	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
		breaks: true
	});

	$: currentWallpaperProperties =
		$settingsStore?.wallpaperProperties?.[wallpaperId] || {};

	function getPropertyValue(prop: WallpaperProperty) {
		const savedValue = currentWallpaperProperties[prop.name];
		if (savedValue !== undefined) {
			return savedValue;
		}
		return prop.value;
	}

	function parseProperties(rawProperties: Record<string, any>) {
		const parsed: WallpaperProperty[] = [];
		for (const [name, data] of Object.entries(rawProperties)) {
			let options: Record<string, string> = {};
			if (Array.isArray(data.options)) {
				data.options.forEach((opt: any) => {
					options[opt.label || opt.text || opt.value] = String(
						opt.value
					);
				});
			} else if (typeof data.options === 'object') {
				options = data.options;
			}

			let type = data.type || 'unknown';
			if (type === 'bool') type = 'boolean';
			if (type === 'combo') type = 'combolist';

			parsed.push({
				name,
				type: type as PropertyType,
				description: data.text || name,
				value: data.value,
				min: data.min,
				max: data.max,
				step: data.step,
				options:
					Object.keys(options).length > 0 ? options : undefined
			});
		}
		return parsed.sort(
			(a, b) =>
				(rawProperties[a.name].order ?? 0) -
				(rawProperties[b.name].order ?? 0)
		);
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

	function renderMarkdown(text: string) {
		if (!text) return '';

		let processed = text
			.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
			.replace(/<big>(.*?)<\/big>/gi, (_, content) => {
				if (content.length < 50) return `\n\n## ${content}\n\n`;
				return `\n\n<div class="big-text">${content}</div>\n\n`;
			})
			.replace(/<br\s*\/?>/gi, '  \n');

		return md.render(processed);
	}

	function getLabelParts(prop: WallpaperProperty) {
		if (prop.name === 'schemecolor') {
			return { header: '', label: 'Theme Color', isPureHeader: false };
		}

		const rawText = prop.description || prop.name;
		const text = rawText.trim();

		if (!text.startsWith('<')) {
			return { header: '', label: rawText, isPureHeader: false };
		}

		const hasBigHeaderTags =
			/<(h[1-6]|hr|big|img|p|div|center|br)\b/i.test(text);

		if (hasBigHeaderTags) {
			const plainText = text.replace(/<[^>]*>/g, '').trim();
			const isPure =
				plainText.length === 0 ||
				/^<(hr|h[1-6]|big|img)\b/i.test(text);
			if (isPure) {
				return { header: text, label: '', isPureHeader: true };
			}
		}

		const blockTags = ['hr', 'br', 'img', 'h[1-6]', 'big', 'p', 'div'];
		const leadingTagPattern = blockTags
			.map(
				(t) =>
					`<${t}\b[^>]*>.*?<\/${t.replace('[1-6]', 'd')}>` +
					`|<${t}\b[^>]*\/?>`
			)
			.join('|');

		const match = text.match(
			new RegExp(`^((?:\s|${leadingTagPattern})+)(.*)$`, 'is')
		);

		if (match && match[1].trim()) {
			const header = match[1].trim();
			const label = match[2].trim();
			return { header, label, isPureHeader: label.length === 0 };
		}

		return { header: '', label: rawText, isPureHeader: false };
	}
</script>

<div class="properties-wrapper" style="color: {textColor}">
	<div class="header">
		<span class="title">Properties</span>
		<div class="divider"></div>
	</div>

	{#if loading}
		<div class="status-msg">Loading properties...</div>
	{:else if properties.length === 0}
		<div class="status-msg empty">No configurable properties.</div>
	{:else}
		<div class="properties-list">
			{#each properties as prop}
				{#if prop.type === 'group' || prop.type === 'text'}
					<div class="rich-text-content">
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
						<SettingItem
							label={''}
							vertical={label.length > 30 ||
								header.length > 0}
						>
							<div slot="label" class="markdown-label">
								{@html renderMarkdown(
									label ||
										(prop.name !== 'schemecolor'
											? prop.name
											: '')
								)}
							</div>
							{#if prop.type === 'slider'}
								<Range
									id="prop-{wallpaperId}-{prop.name}"
									min={prop.min ?? 0}
									max={prop.max ?? 1}
									step={prop.step ?? 0.01}
									value={parseFloat(
										getPropertyValue(prop)
									)}
									on:input={(e) =>
										handleRange(prop.name, e)}
								/>
							{:else if prop.type === 'boolean'}
								<Toggle
									id="prop-{wallpaperId}-{prop.name}"
									checked={getPropertyValue(prop) ===
										'1' ||
										getPropertyValue(prop) ===
											'true' ||
										getPropertyValue(prop) ===
											true}
									onChange={(val) =>
										handleToggle(prop.name, val)}
								/>
							{:else if prop.type === 'combolist'}
								<Select
									id="prop-{wallpaperId}-{prop.name}"
									value={getPropertyValue(prop)}
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
									value={getPropertyValue(prop)}
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
									value={getPropertyValue(prop)}
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
						</SettingItem>
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.properties-wrapper {
		margin-top: 25px;
		padding: 20px;
		background: var(--bg-surface-active);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);

		.header {
			display: flex;
			align-items: center;
			gap: 15px;
			margin-bottom: 20px;

			.title {
				font-size: 0.9em;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 1px;
				opacity: 0.8;
				white-space: nowrap;
			}

			.divider {
				height: 1px;
				flex-grow: 1;
				background: linear-gradient(
					90deg,
					var(--border-color),
					transparent
				);
			}
		}

		.status-msg {
			padding: 20px;
			text-align: center;
			font-style: italic;
			opacity: 0.6;
			font-size: 0.9em;
		}

		.properties-list {
			display: flex;
			flex-direction: column;
			gap: 12px;

			.external-header {
				margin-top: 15px;
				margin-bottom: 5px;
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

			.markdown-label {
				font-size: 0.95em;
				line-height: 1.4;
				width: 100%;

				:global(p) {
					margin: 0;
					display: inline;
				}
			}

			.rich-text-content {
				padding: 10px 0;
				font-size: 0.95em;
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
