<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { formatBytes, formatDate } from '@/utils/formatHelper';
	import type { Wallpaper } from '@shared/types';

	interface InfoItem {
		label: string;
		value: string;
	}

	interface EngagementStat {
		label: string;
		value: number;
	}

	export let wallpaper: Wallpaper;
	export let fileSize: number | null = null;

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

	const formatStat = (value: number | undefined): string =>
		(value || 0).toLocaleString();

	// Computed properties
	$: projectData = (wallpaper?.projectData || {}) as any;
	$: folderName = wallpaper?.folderName;

	// Normalize data
	$: displayFileSize =
		fileSize ||
		(projectData.file_size
			? parseInt(projectData.file_size)
			: projectData.fileSize);
	$: createdDate = projectData.time_created
		? projectData.time_created * 1000
		: projectData.timeCreated
			? projectData.timeCreated * 1000
			: undefined;
	$: updatedDate = projectData.time_updated
		? projectData.time_updated * 1000
		: projectData.timeUpdated
			? projectData.timeUpdated * 1000
			: undefined;

	// Stats
	$: stats = projectData.statistics || {};
	$: views =
		typeof projectData.views !== 'undefined'
			? projectData.views
			: parseInt(stats.numUniqueWebsiteViews || '0');
	$: subs =
		typeof projectData.subscriptions !== 'undefined'
			? projectData.subscriptions
			: typeof projectData.Subs !== 'undefined'
				? projectData.Subs
				: parseInt(stats.numSubscriptions || '0');
	$: favorites =
		typeof projectData.favorited !== 'undefined'
			? projectData.favorited
			: parseInt(stats.numFavorites || '0');
	$: upvotes = projectData.numUpvotes || 0;

	// Build engagement stats array
	$: engagementStats = [
		{ label: 'Views', value: views },
		{ label: 'Subs', value: subs },
		{ label: 'Favorites', value: favorites },
		{ label: 'Upvotes', value: upvotes }
	].filter((s: any) => s.value > 0) as EngagementStat[];

	// Build file info array
	$: fileInfo = [
		...(displayFileSize
			? [{ label: 'File Size', value: formatBytes(displayFileSize) }]
			: []),
		...(createdDate
			? [{ label: 'Created', value: formatDate(createdDate) }]
			: []),
		...(updatedDate
			? [{ label: 'Updated', value: formatDate(updatedDate) }]
			: []),
		...(projectData.banned ? [{ label: 'Status', value: 'Banned' }] : [])
	] as InfoItem[];

	// Check if sections should be visible
	$: hasContent = {
		stats: engagementStats.length > 0,
		fileInfo: fileInfo.length > 0,
		tags: projectData.tags?.length > 0,
		description:
			(projectData.description || projectData.file_description)?.trim()
				.length > 0
	};

	// Get description text with fallback
	$: description =
		projectData.file_description || projectData.description || '';
</script>

<div class="workshop-sidebar">
	<!-- Header Section -->
	<div class="section header-section">
		<h3 class="title">{projectData?.title || folderName}</h3>
		<div class="header-meta">
			{#if projectData?.creator}
				<p class="creator">by {projectData.creator}</p>
			{/if}
			{#if displayFileSize}
				<p class="file-size-badge">
					{formatBytes(displayFileSize)}
				</p>
			{/if}
		</div>
	</div>

	<!-- Tags -->
	{#if hasContent.tags}
		<div class="section content-section">
			<h4 class="section-title">Tags</h4>
			{#if projectData?.tags?.length}
				<div class="tags-container">
					{#each projectData.tags as tag (tag)}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Description -->
	{#if hasContent.description}
		<div class="section description-section">
			<h4 class="section-title">Description</h4>
			<div class="description-content">
				{@html renderMarkdown(description)}
			</div>
		</div>
	{/if}

	<!-- Engagement Stats -->
	{#if hasContent.stats}
		<div class="section stats-section">
			<h4 class="section-title">Engagement</h4>
			<div class="stats-grid">
				{#each engagementStats as stat (stat.label)}
					<div class="stat-card">
						<div class="stat-value">
							{formatStat(stat.value)}
						</div>
						<div class="stat-label">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- File Information -->
	{#if hasContent.fileInfo}
		<div class="section info-section">
			<h4 class="section-title">File Info</h4>
			<div class="info-list">
				{#each fileInfo as item (item.label)}
					<div class="info-item">
						<span class="info-label">{item.label}:</span>
						<span
							class="info-value"
							class:banned={item.value === 'Banned'}
							>{item.value}</span
						>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.workshop-sidebar {
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
				margin: 0 0 8px 0;
				font-size: 1.4rem;
				font-weight: 600;
				line-height: 1.3;
			}

			.creator {
				margin: 0;
				font-size: 0.9rem;
				color: var(--text-muted);
			}

			.header-meta {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
			}

			.file-size-badge {
				margin: 0;
				font-size: 0.8rem;
				font-weight: 700;
				padding: 2px 8px;
				background: var(--bg-surface-active);
				border-radius: 12px;
				color: var(--btn-primary-bg);
				border: 1px solid var(--btn-primary-bg);
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

		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
			gap: 10px;

			.stat-card {
				background: var(--bg-surface-hover);
				border: 1px solid var(--border-color);
				border-radius: 6px;
				padding: 12px 8px;
				text-align: center;
				transition: var(--transition-base);

				&:hover {
					border-color: var(--btn-primary-bg);
					transform: translateY(-2px);
				}

				.stat-value {
					font-size: 1.1rem;
					font-weight: 700;
					margin-bottom: 2px;
				}

				.stat-label {
					font-size: 0.7rem;
					color: var(--text-muted);
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}
			}
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

				&.banned {
					color: #ff4d4d;
				}
			}
		}

		.tags-container {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;

			.tag {
				background: var(--bg-surface-hover);
				border: 1px solid var(--btn-primary-bg);
				border-radius: 12px;
				padding: 4px 10px;
				font-size: 0.8rem;
				font-weight: 500;
				transition: var(--transition-base);

				&:hover {
					background: var(--btn-primary-bg);
					color: var(--btn-text-color);
				}
			}
		}

		.description-content {
			:global(a) {
				color: var(--btn-primary-bg);
				text-decoration: underline;
				background: transparent !important;
				padding: 0 !important;
				display: inline !important;
			}
		}
	}
</style>
