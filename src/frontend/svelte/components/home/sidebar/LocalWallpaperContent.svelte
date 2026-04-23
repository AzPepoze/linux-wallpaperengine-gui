<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { formatBytes } from '@/utils/formatHelper';
	import type { Wallpaper } from '@shared/types';
	import WallpaperProperties from '../WallpaperProperties.svelte';

	export let wallpaper: Wallpaper;
	export let fileSize: number | null = null;
	export let textColor: string = 'var(--text-color)';
	export let palette: [number, number, number][] = [];

	const md = new MarkdownIt();

	// Markup parsers
	const parseURLTags = (text: string) =>
		text.replace(/\[url=([^\]]+)\]([^\[]*?)\[\/url\]/g, '[$2]($1)');

	const parseImgTags = (text: string) =>
		text.replace(/\[img\]([^\[]+)\[\/img\]/g, '![]($1)');

	const renderMarkdown = (text: string): string => {
		if (!text) return '';
		return md.render(parseImgTags(parseURLTags(text)));
	};

	$: projectData = (wallpaper?.projectData || {}) as any;
	$: folderName = wallpaper?.folderName;

	$: displayFileSize =
		fileSize ||
		(projectData.file_size
			? parseInt(projectData.file_size)
			: projectData.fileSize);

	$: description = projectData.description || '';
</script>

<div class="local-sidebar">
	<div class="section header-section">
		<h3 class="title">{projectData?.title || folderName}</h3>
		<p class="folder-name">Folder: {folderName}</p>
	</div>

	<div class="section info-section">
		<h4 class="section-title">File Info</h4>
		<div class="info-list">
			{#if displayFileSize}
				<div class="info-item">
					<span class="info-label">Size:</span>
					<span class="info-value">{formatBytes(displayFileSize)}</span>
				</div>
			{/if}
			{#if projectData.type}
				<div class="info-item">
					<span class="info-label">Type:</span>
					<span class="info-value">{projectData.type}</span>
				</div>
			{/if}
			{#if projectData.version}
				<div class="info-item">
					<span class="info-label">Version:</span>
					<span class="info-value">{projectData.version}</span>
				</div>
			{/if}
			{#if projectData.contentrating}
				<div class="info-item">
					<span class="info-label">Rating:</span>
					<span class="info-value">{projectData.contentrating}</span>
				</div>
			{/if}
		</div>
	</div>

	{#if description}
		<div class="section description-section">
			<h4 class="section-title">Description</h4>
			<div class="description-content">
				{@html renderMarkdown(description)}
			</div>
		</div>
	{/if}

	<hr />

	<div class="section properties-section">
		<h4 class="section-title">Properties</h4>
		<WallpaperProperties wallpaperId={folderName} {textColor} {palette} />
	</div>
</div>

<style lang="scss">
	.local-sidebar {
		display: flex;
		flex-direction: column;
		gap: 20px;

		.section {
			background: var(--bg-surface-active);
			border-radius: 8px;
			padding: 16px;
			transition: var(--transition-base);
		}

		.header-section {
			background: transparent;
			padding: 0;

			.title {
				margin: 0 0 4px 0;
				font-size: 1.4rem;
				font-weight: 600;
			}

			.folder-name {
				margin: 0;
				font-size: 0.85rem;
				color: var(--text-muted);
				font-style: italic;
			}
		}

		.section-title {
			margin: 0 0 12px 0;
			font-size: 0.85rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: var(--text-muted);
			border-bottom: 2px solid var(--btn-primary-bg);
			padding-bottom: 4px;
		}

		.info-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.info-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background: var(--bg-surface-hover);
			border-radius: 6px;
			border-left: 3px solid var(--btn-primary-bg);

			.info-label {
				font-weight: 600;
				font-size: 0.9rem;
			}
			.info-value {
				font-weight: 500;
				font-size: 0.9rem;
			}
		}

		.properties-section {
			background: transparent;
			padding: 0;
		}
	}
</style>
