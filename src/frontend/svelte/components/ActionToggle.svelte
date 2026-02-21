<script lang="ts">
	import Button from './ui/Button.svelte';

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
			Loading...
		{:else}
			Load Items
		{/if}
	</Button>
	<Button
		variant={activeAction === 'browse' ? 'primary' : 'ghost'}
		on:click={handleBrowseClick}
		disabled={isLoading}
	>
		Open in Browser
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
