<script lang="ts">
	import Button from '@/ui/Button.svelte';
	import Icon from '@/ui/Icon.svelte';
</script>

<div class="refresh">
	<Button variant="primary" on:click title="Refresh Wallpapers">
		<Icon name="refresh" size={20} />
	</Button>
</div>

<style>
     :global(.btn) {
          padding: 8px 8px !important;
     }
</style>
