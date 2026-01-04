<script lang="ts">
     export let label: string;
     export let id: string = "";
     export let vertical: boolean = false;
</script>

<div class="form-group" class:vertical>
     <label for={id}>{label}</label>
     {#if vertical}
          <slot />
     {:else}
          <div>
               <slot />
          </div>
     {/if}
</div>

<style>
     .form-group {
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
     }

     .form-group.vertical {
          flex-direction: column;
          align-items: stretch;
     }

     .form-group label {
          margin-bottom: 0;
          font-weight: 500;
          font-size: 1em;
          flex: 1;
          white-space: nowrap;
          text-align: left;
          min-width: 50%;
          max-width: 50%;
          text-overflow: ellipsis;
          overflow: hidden;
     }

     :global(.form-group > div) {
          flex: 1;
          min-width: 0;
          display: flex;
          justify-content: flex-end;
     }
</style>
