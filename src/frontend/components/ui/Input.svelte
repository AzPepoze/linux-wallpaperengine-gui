<script lang="ts">
     export let value: string | number;
     export let type: "text" | "number" = "text";
     export let id: string = "";
     export let placeholder: string = "";
     export let min: number | undefined = undefined;
     export let max: number | undefined = undefined;
</script>

<div>
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

<style>
     div {
          width: 100%;
          min-width: 100%;
     }

     input {
          width: 100%;
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--input-border-color, rgba(255, 255, 255, 0.2));
          border-radius: 6px;
          background-color: var(--input-bg-color, rgba(255, 255, 255, 0.1));
          color: var(--input-text-color, #fff);
          box-sizing: border-box;
          transition: all 0.2s;
     }

     input:focus {
          outline: none;
          border-color: var(--btn-primary-bg, #007bff);
          background-color: rgba(255, 255, 255, 0.2);
     }
</style>
