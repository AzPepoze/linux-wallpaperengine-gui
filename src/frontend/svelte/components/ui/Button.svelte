<script lang="ts">
     export let type: "button" | "submit" | "reset" = "button";
     export let variant: "primary" | "secondary" | "ghost" = "primary";
     export let disabled = false;
</script>

<button {type} class="btn {variant}" {disabled} on:click {...$$restProps}>
     <slot />
</button>

<style lang="scss">
     .btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          font-size: 0.9em;
          font-weight: 600;
          transition: var(--transition-base);
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          &:disabled {
               opacity: 0.5;
               cursor: not-allowed;
          }

          &:active:not(:disabled) {
               transform: scale(0.95);
          }

          &.primary {
               background-color: var(--btn-primary-bg);
               color: white;
               &:hover:not(:disabled) {
                    background-color: var(--btn-primary-hover-bg);
               }
          }

          &.secondary {
               background-color: var(--btn-secondary-bg);
               color: white;
               &:hover:not(:disabled) {
                    background-color: var(--btn-secondary-hover-bg);
               }
          }

          &.ghost {
               background-color: transparent;
               color: white;
               border: 1px solid var(--border-color);
               &:hover:not(:disabled) {
                    background-color: var(--bg-surface);
                    border-color: var(--border-color-hover);
               }
          }
     }
</style>
