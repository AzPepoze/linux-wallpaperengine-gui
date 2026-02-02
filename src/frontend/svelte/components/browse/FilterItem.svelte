<script lang="ts">
     export let label: string;
     export let isActive: boolean = false;
     export let onClick: () => void;
</script>

<button class="filter-item" class:active={isActive} on:click={onClick}>
     <div class="checkbox">
          {#if isActive}
               <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
               >
                    <polyline points="20 6 9 17 4 12" />
               </svg>
          {/if}
     </div>
     <span>{label}</span>
</button>

<style lang="scss">
     .filter-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          color: var(--text-muted);
          font-size: 0.95em;
          transition: var(--transition-base);
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          width: 100%;
          font-weight: 500;

          .checkbox {
               width: 18px;
               height: 18px;
               border: 2px solid var(--border-color);
               border-radius: 4px;
               display: flex;
               align-items: center;
               justify-content: center;
               transition: var(--transition-base);
               background: var(--bg-surface);
               color: white;

               svg {
                    width: 12px;
                    height: 12px;
                    opacity: 0;
                    transform: scale(0.5);
                    transition: all 0.2s ease;
               }
          }

          span {
               flex: 1;
          }

          &:hover {
               color: var(--text-color);
               background: var(--bg-surface-hover);

               .checkbox {
                    border-color: var(--text-muted);
               }
          }

          &.active {
               background: rgba(0, 123, 255, 0.1);
               border-color: rgba(0, 123, 255, 0.2);
               color: var(--text-color);

               .checkbox {
                    background: var(--btn-primary-bg);
                    border-color: var(--btn-primary-bg);

                    svg {
                         opacity: 1;
                         transform: scale(1);
                    }
               }
          }
     }
</style>
