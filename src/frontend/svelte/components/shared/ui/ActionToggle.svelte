<script lang="ts">
	import Button from '@/components/shared/ui/Button.svelte';
	import Icon from '@/components/shared/ui/Icon.svelte';

	export let activeAction: 'load' | 'browse' = 'load';
	export let onLoadItems: () => void;
	export let onOpenInBrowser: () => void;
	export let isLoading: boolean = false;

	function handleLoadClick() {
		activeAction = 'load';
		onLoadItems();
	}

	function handleBrowseClick() {
		activeAction = 'browse';
		onOpenInBrowser();
	}
</script>

<div class="action-toggle">
	<Button
		variant={activeAction === 'load' ? 'primary' : 'ghost'}
		on:click={handleLoadClick}
		disabled={isLoading}
	>
		{#if isLoading && activeAction === 'load'}
			<Icon name="sync" className="spin" size={18} />
			<span>Loading...</span>
		{:else}
			<Icon name="sync" size={18} />
			<span>Load Items</span>
		{/if}
	</Button>
	<Button
		variant={activeAction === 'browse' ? 'primary' : 'ghost'}
		on:click={handleBrowseClick}
		disabled={isLoading}
	>
		<Icon name="open_in_new" size={18} />
		<span>Open in Browser</span>
	</Button>
</div>

<style lang="scss">
	.action-toggle {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;

		:global(.btn) {
			flex: 1;
		}
	}
</style>
