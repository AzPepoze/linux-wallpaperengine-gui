<script lang="ts">
  export let type: "button" | "submit" | "reset" = "button";
  export let variant: "primary" | "secondary" | "ghost" = "primary";
  export let disabled = false;

  // For capturing the click event
</script>

<button
  {type}
  class="btn {variant}"
  {disabled}
  on:click
>
  <slot />
</button>

<style lang="scss">
  .btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 600;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.primary {
      background-color: var(--btn-primary-bg, #007bff);
      color: white;
      &:hover:not(:disabled) {
        background-color: var(--btn-primary-hover-bg, #0056b3);
      }
    }

    &.secondary {
      background-color: var(--btn-secondary-bg, #444);
      color: white;
      &:hover:not(:disabled) {
        background-color: var(--btn-secondary-hover-bg, #555);
      }
    }

    &.ghost {
      background-color: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
  }
</style>
