<script lang="ts">
	import Icon from '@/components/shared/ui/Icon.svelte';
	import Select from '@/components/shared/ui/Select.svelte';
	import { t } from '@/i18n';

	interface Props {
		searchQuery: string;
		levelFilter: string;
	}

	let { searchQuery = $bindable(), levelFilter = $bindable() }: Props = $props();

	let filterOptions = $derived([
		{ label: $t('logs.toolbar.allLevels'), value: 'all' },
		{ label: $t('logs.toolbar.info'), value: 'info' },
		{ label: $t('logs.toolbar.success'), value: 'success' },
		{ label: $t('logs.toolbar.warning'), value: 'warning' },
		{ label: $t('logs.toolbar.error'), value: 'error' }
	]);
</script>

<div class="panel-toolbar">
	<div class="search-input-wrapper">
		<Icon name="search" size={14} className="search-icon" />
		<input 
			type="text" 
			placeholder={$t('logs.toolbar.searchPlaceholder')} 
			bind:value={searchQuery}
		/>
		{#if searchQuery}
			<button class="search-clear-btn" onclick={() => searchQuery = ""}>
				<Icon name="close" size={12} />
			</button>
		{/if}
	</div>
	<div class="toolbar-select">
		<Select bind:value={levelFilter} options={filterOptions} />
	</div>
</div>

<style lang="scss">
	.panel-toolbar {
		display: flex;
		gap: 6px;
		padding: 6px 10px;
		background: rgba(0, 0, 0, 0.15);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		flex-shrink: 0;
	}

	.search-input-wrapper {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		
		:global(.search-icon) {
			position: absolute;
			left: 10px;
			color: var(--text-muted) !important;
			pointer-events: none;
		}
		
		input {
			width: 100%;
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid rgba(255, 255, 255, 0.06);
			border-radius: var(--radius-md, 6px);
			padding: 4px 24px 4px 30px;
			color: var(--text-color);
			font-size: 0.75rem;
			height: 28px;
			box-sizing: border-box;
			transition: all 0.2s;
			
			&:focus {
				outline: none;
				border-color: var(--btn-primary-bg);
				background: rgba(255, 255, 255, 0.05);
				box-shadow: 0 0 0 1px rgba(var(--primary-raw-rgb), 0.2);
			}
			
			&::placeholder {
				color: var(--text-muted);
			}
		}
		
		.search-clear-btn {
			position: absolute;
			right: 6px;
			background: transparent;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 2px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			
			&:hover {
				color: var(--text-color);
				background: rgba(255, 255, 255, 0.1);
			}
		}
	}

	.toolbar-select {
		width: 110px;
		flex-shrink: 0;

		:global(.select-trigger) {
			height: 28px;
			padding: 0px 8px 0px 10px;
			font-size: 0.75rem;
			border-radius: var(--radius-md, 6px);
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid rgba(255, 255, 255, 0.06);

			&:hover {
				background: rgba(255, 255, 255, 0.05);
				transform: none;
			}
		}

		:global(.select-trigger.active) {
			border-color: var(--btn-primary-bg);
			background: rgba(255, 255, 255, 0.05);
			box-shadow: none;
		}

		:global(.options-dropdown) {
			top: calc(100% + 4px);
			border-radius: 6px;
			padding: 4px;
		}

		:global(.option-item) {
			padding: 6px 8px;
			font-size: 0.75rem;
			border-radius: 4px;
			opacity: 0.85;

			&:hover {
				transform: none;
			}
		}

		:global(.chevron) {
			margin-left: 6px;
		}
	}
</style>
