<script lang="ts">
     export let value: string | number;
     export let type: "text" | "number" = "text";
     export let id: string = "";
     export let placeholder: string = "";
     export let min: number | undefined = undefined;
     export let max: number | undefined = undefined;
</script>

<div class="input-wrapper">
     <input
          {type}
          {id}
          bind:value
          {placeholder}
          {min}
          {max}
          {...$$restProps}
          on:input
          on:change
     />
</div>

<style lang="scss">
     .input-wrapper {
          width: 100%;
          display: flex;
     }

     input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-surface);
          color: var(--text-color);
          font-size: 0.9em;
          box-sizing: border-box;
          transition: var(--transition-base);

          &:hover {
               background-color: var(--bg-surface-hover);
               border-color: var(--border-color-hover);
          }

          &:focus {
               outline: none;
               border-color: var(--btn-primary-bg);
               background-color: var(--bg-surface-active);
               box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
          }

          &::placeholder {
               color: var(--text-muted);
          }
     }
</style>
