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
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background-color: rgba(255, 255, 255, 0.03);
          color: #fff;
          font-size: 0.9em;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
               background-color: rgba(255, 255, 255, 0.05);
               border-color: rgba(255, 255, 255, 0.15);
          }

          &:focus {
               outline: none;
               border-color: var(--btn-primary-bg, #007bff);
               background-color: rgba(255, 255, 255, 0.08);
               box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
          }

          &::placeholder {
               color: rgba(255, 255, 255, 0.25);
          }
     }
</style>
