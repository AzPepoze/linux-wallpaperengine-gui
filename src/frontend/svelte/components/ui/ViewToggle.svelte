<script lang="ts">
     import Button from "./Button.svelte";
     import GridIcon from "../../icons/GridIcon.svelte";
     import ListIcon from "../../icons/ListIcon.svelte";

     export let viewMode: "grid" | "list" | "detail" = "grid";
</script>

<div class="view-toggles">
     <Button
          variant={viewMode === "grid" ? "primary" : "secondary"}
          on:click={() => (viewMode = "grid")}
          title="Grid View"
     >
          <GridIcon width="20" height="20" />
          <span>Grid</span>
     </Button>
     <Button
          variant={viewMode === "list" || viewMode === "detail"
               ? "primary"
               : "secondary"}
          on:click={() =>
               (viewMode = viewMode === "detail" ? "detail" : "list")}
          title="List View"
     >
          <ListIcon width="20" height="20" />
          <span>List</span>
     </Button>
</div>

<style>
     .view-toggles {
          display: flex;
          gap: 8px;
     }

     :global(.view-toggles .btn) {
          padding: 8px 12px !important;
          font-size: 0.85em !important;
     }
</style>
