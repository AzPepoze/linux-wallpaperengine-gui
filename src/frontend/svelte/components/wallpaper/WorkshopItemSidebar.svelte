<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { formatBytes, formatDate } from '../../utils/formatHelper';
	import type { Wallpaper } from '../../../shared/types';

	interface InfoItem {
		label: string;
		value: string;
	}

	interface EngagementStat {
		label: string;
		value: number;
	}

	export let wallpaper: Wallpaper;

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
	$: fileSize = projectData.file_size
		? parseInt(projectData.file_size)
		: projectData.fileSize;
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
		...(fileSize
			? [{ label: 'File Size', value: formatBytes(fileSize) }]
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
		<h1 class="title">{projectData?.title || folderName}</h1>
		<div class="header-meta">
			{#if projectData?.creator}
				<p class="creator">by {projectData.creator}</p>
			{/if}
			{#if fileSize}
				<p class="file-size-badge">{formatBytes(fileSize)}</p>
			{/if}
		</div>
	</div>

	<!-- Tags -->
	{#if hasContent.tags}
		<div class="section content-section">
			<h2 class="section-title">Tags</h2>
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
			<h2 class="section-title">Description</h2>
			<div class="description-content">
				{@html renderMarkdown(description)}
			</div>
		</div>
	{/if}

	<!-- Engagement Stats -->
	{#if hasContent.stats}
		<div class="section stats-section">
			<h2 class="section-title">Engagement</h2>
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
			<h2 class="section-title">File Info</h2>
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
		color: var(--text-color);
		overflow: hidden;

		/* Container styling */
		border-radius: 12px;
		background-attachment: fixed;

		.section {
			background: var(--bg-surface-active);
			border-radius: 8px;
			padding-block: 1.25rem;
			transition: var(--transition-base);
		}

		.header-section {
			background: transparent;
			box-shadow: none;
			border: none;
			.title {
				margin: 0 0 0.5rem 0;
				font-size: 1.5rem;
				font-weight: 600;
				line-height: 1.3;
				color: var(--text-color);
			}

			.creator {
				margin: 0;
				font-size: 0.9rem;
				color: var(--text-muted);
				opacity: 1;
			}

			.header-meta {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
				margin-top: 4px;
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
			margin: 0 0 1rem 0;
			font-size: 0.95rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--text-color);
			border-bottom: 2px solid var(--btn-primary-bg);
			padding-bottom: 0.5rem;
		}

		/* Stats Grid */
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
			gap: 0.75rem;
			margin-top: 1rem;

			.stat-card {
				background: var(--bg-surface-hover);
				border: 1px solid var(--border-color);
				border-radius: 6px;
				padding: 1rem 0.75rem;
				text-align: center;
				transition: var(--transition-base);

				&:hover {
					border-color: var(--btn-primary-bg);
					transform: translateY(-2px);
				}

				.stat-value {
					display: block;
					font-size: 1.3rem;
					font-weight: 700;
					color: var(--text-color);
					margin-bottom: 0.25rem;
				}

				.stat-label {
					display: block;
					font-size: 0.8rem;
					color: var(--text-muted);
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}
			}
		}

		/* Lists */
		.info-list {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.info-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.75rem;
			background: var(--bg-surface-hover);
			border-radius: 4px;
			border-left: 3px solid var(--btn-primary-bg);

			.info-label {
				font-weight: 600;
				color: var(--text-color);
				flex: 0 0 auto;
			}
			.info-value {
				text-align: right;
				color: var(--text-color);
				font-weight: 500;
				flex: 1;
				padding-left: 1rem;

				&.banned {
					color: var(--error-bg);
				}
			}
		}

		/* Tags */
		.tags-container {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin-top: 0.75rem;

			.tag {
				background: var(--bg-surface-hover);
				color: var(--text-color);
				border: 1px solid var(--btn-primary-bg);
				border-radius: 12px;
				padding: 0.35rem 0.75rem;
				font-size: 0.85rem;
				font-weight: 500;
				transition: var(--transition-base);

				&:hover {
					background: var(--btn-primary-bg);
					color: var(--sidebar-btn-text-final);
				}
			}
		}

		/* Description */
		.description-content {
			border-radius: 6px;
			line-height: 1.7;
			word-wrap: break-word;

			/* Markdown overrides */
			:global(h1) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}
			:global(h2) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}
			:global(h3) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}
			:global(h4) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}
			:global(h5) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}
			:global(h6) {
				margin: 1rem 0 0.5rem 0;
				color: var(--btn-primary-bg);
			}

			:global(p) {
				margin: 0.5rem 0;
				color: var(--text-color);
			}

			:global(a) {
				color: var(--btn-primary-bg);
				text-decoration: none;
				border-bottom: 1px dotted var(--btn-primary-bg);

				&:hover {
					text-decoration: underline;
				}
			}

			:global(code) {
				background: var(--bg-surface);
				padding: 0.2em 0.4em;
				border-radius: 3px;
				color: var(--btn-primary-bg);
				font-family: 'Courier New', monospace;
			}

			:global(img) {
				max-width: 100%;
				height: auto;
				border-radius: 6px;
				margin: 1rem 0;
			}

			:global(ul) {
				margin: 0.5rem 0;
				padding-left: 2rem;
			}

			:global(ol) {
				margin: 0.5rem 0;
				padding-left: 2rem;
			}

			:global(li) {
				margin: 0.25rem 0;
			}

			:global(blockquote) {
				border-left: 4px solid var(--btn-primary-bg);
				padding-left: 1rem;
				margin: 0.5rem 0;
				opacity: 0.9;
			}

			:global(table) {
				border-collapse: collapse;
				width: 100%;
				margin: 1rem 0;
			}

			:global(th) {
				border: 1px solid var(--border-color);
				padding: 0.5rem;
				background: var(--bg-surface);
				font-weight: 600;
			}

			:global(td) {
				border: 1px solid var(--border-color);
				padding: 0.5rem;
			}
		}
	}
</style>
