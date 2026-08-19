<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { formatBytes } from '@/core/utils/formatHelper';
	import type { Wallpaper } from '@shared/types';
	import WallpaperProperties from '../WallpaperProperties.svelte';
	import { t } from '@/core/i18n';
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';
	import { logger } from '@/core/logger';

	import {
		previewingWallpaperId,
		startWallpaperPreview,
		stopWallpaperPreview
	} from '@/features/wallpaper/scripts/preview';

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
	
	$: installDate = wallpaper?.installDate ? wallpaper.installDate * 1000 : undefined;
	
	const formatDate = (dateNum: number) => {
		const d = new Date(dateNum);
		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	async function handleOpenFolder() {
		try {
			const basePath = await window.electronAPI.getWallpaperBasePath();
			if (basePath && folderName) {
				await window.electronAPI.openPath(`${basePath}/${folderName}`);
			}
		} catch (e) {
			logger.error('Failed to open wallpaper folder:', e);
		}
	}

	function handleTogglePreview() {
		if ($previewingWallpaperId === folderName) {
			stopWallpaperPreview();
		} else if (folderName) {
			startWallpaperPreview(folderName);
		}
	}
</script>

<div class="local-sidebar">
	<div class="section header-section">
		<h3 class="title">{projectData?.title || folderName}</h3>
		<div class="actions-row">
			<Button
				variant="ghost"
				class="pill-btn folder-btn"
				on:click={handleOpenFolder}
				title="Open folder location"
			>
				<Icon name="folder_open" size={14} />
				<span class="folder-name">{$t('sidebar.local.folder')} {folderName}</span>
			</Button>

			<Button
				variant="ghost"
				class="pill-btn preview-btn {$previewingWallpaperId === folderName ? 'active' : ''}"
				on:click={handleTogglePreview}
				title={$previewingWallpaperId === folderName ? $t('sidebar.local.stopPreview') : $t('sidebar.local.livePreview')}
			>
				<Icon name={$previewingWallpaperId === folderName ? 'stop' : 'open_in_browser'} size={14} />
				<span>{$previewingWallpaperId === folderName ? $t('sidebar.local.stopPreview') : $t('sidebar.local.livePreview')}</span>
			</Button>
		</div>
	</div>

	<div class="section info-section">
		<h4 class="section-title">{$t('sidebar.local.fileInfo')}</h4>
		<div class="info-list">
			{#if displayFileSize}
				<div class="info-item">
					<span class="info-label">{$t('sidebar.local.size')}</span>
					<span class="info-value">{formatBytes(displayFileSize)}</span>
				</div>
			{/if}
			{#if projectData.type}
				<div class="info-item">
					<span class="info-label">{$t('sidebar.local.type')}</span>
					<span class="info-value">{projectData.type}</span>
				</div>
			{/if}
			{#if projectData.version}
				<div class="info-item">
					<span class="info-label">{$t('sidebar.local.version')}</span>
					<span class="info-value">{projectData.version}</span>
				</div>
			{/if}
			{#if projectData.contentrating}
				<div class="info-item">
					<span class="info-label">{$t('sidebar.local.rating')}</span>
					<span class="info-value">{projectData.contentrating}</span>
				</div>
			{/if}
			{#if installDate}
				<div class="info-item">
					<span class="info-label">{$t('sidebar.local.installed')}</span>
					<span class="info-value">{formatDate(installDate)}</span>
				</div>
			{/if}
		</div>
	</div>

	{#if description}
		<div class="section description-section">
			<h4 class="section-title">{$t('sidebar.local.description')}</h4>
			<div class="description-content">
				{@html renderMarkdown(description)}
			</div>
		</div>
	{/if}

	<hr />

	<div class="section properties-section">
		<h4 class="section-title">{$t('sidebar.local.properties')}</h4>
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

			.actions-row {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 8px;
				margin-top: 8px;
			}

			:global(.pill-btn) {
				padding: 4px 12px;
				width: fit-content;
				border-radius: 9999px;
				gap: 6px;
				font-size: 0.85rem;
				font-style: normal;
				font-weight: 500;
				color: var(--text-color);
				background: var(--bg-surface);
				border: 1px solid var(--border-color);
				transition: var(--transition-base);

				&:hover:not(:disabled) {
					background: var(--bg-surface-hover);
					border-color: var(--border-color-hover);
					color: var(--text-color);
				}
			}

			:global(.pill-btn.active) {
				background: var(--danger-color, #ef4444);
				border-color: var(--danger-color, #ef4444);
				color: #fff;

				&:hover:not(:disabled) {
					filter: brightness(1.1);
				}
			}

			.folder-name {
				margin: 0;
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
