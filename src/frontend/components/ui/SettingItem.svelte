<script lang="ts">
     export let label: string;
     export let id: string = "";
     export let vertical: boolean = false;
     export let description: string = "";
     export let alignEnd: boolean = true;
</script>

<div class="setting-item" class:vertical class:align-end={alignEnd}>
     <div class="info">
          {#if $$slots.label}
               <div class="label-slot">
                    <slot name="label" />
               </div>
          {:else}
               <label for={id}>{label}</label>
          {/if}
          {#if description}
               <p class="description">{description}</p>
          {/if}
     </div>
     <div class="control">
          <slot />
     </div>
</div>

<style lang="scss">
     .setting-item {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          flex-wrap: wrap;
          gap: 40px;
          padding: 16px;
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          transition: var(--transition-base);
          border: 1px solid var(--border-color);

          @media (min-width: 900px) {
               &.align-end {
                    justify-content: space-between;
                    gap: 20px;

                    .info {
                         flex: 1;
                    }

                    .control {
                         justify-content: flex-end;
                         flex: 0 0 auto;
                    }
               }
          }

          &:hover {
               background: var(--bg-surface-hover);
               border-color: var(--border-color-hover);
          }

          &.vertical {
               flex-direction: column;
               align-items: stretch;
               gap: 12px;
               justify-content: flex-start;

               .info {
                    flex: none;
                    text-align: inherit;
               }

               .control {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    justify-content: flex-start;
                    width: 100%;
               }
          }

          .info {
               flex: 0 0 300px;
               display: flex;
               flex-direction: column;
               gap: 4px;
               min-width: 0;
               text-align: left;

               label {
                    font-weight: 600;
                    font-size: 0.95em;
                    color: var(--text-color);
                    cursor: pointer;
               }

               .description {
                    font-size: 0.8em;
                    color: var(--text-muted);
                    margin: 0;
                    line-height: 1.4;
               }
          }

          .control {
               display: flex;
               align-items: center;
               justify-content: flex-start;
               min-width: 140px;
               flex: 1;
          }
     }

     :global(.setting-item .control > *) {
          width: auto;
     }
</style>
