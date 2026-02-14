<script lang="ts">
     import Button from "./Button.svelte";
     import RefreshIcon from "../../icons/RefreshIcon.svelte";
</script>

<div class="refresh">
     <Button variant="primary" on:click title="Refresh Wallpapers">
          <RefreshIcon width="20" height="20" />
     </Button>
</div>

<style>
     :global(.btn) {
          padding: 8px 8px !important;
     }
</style>
