<script lang="ts">
     export let value: string;
     export let options: { value: string; label: string }[] = [];
     export let id: string = "";
</script>

<div class="select-wrapper">
     <select {id} bind:value on:change>
          {#each options as option}
               <option value={option.value}>{option.label}</option>
          {/each}
     </select>
</div>

<style>
     .select-wrapper {
          width: 100%;
          min-width: 100%;
     }

     select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--input-border-color, rgba(255, 255, 255, 0.2));
          border-radius: 6px;
          background-color: var(--input-bg-color, rgba(255, 255, 255, 0.1));
          color: var(--input-text-color, #fff);
          box-sizing: border-box;
          transition: all 0.2s;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7em top 50%;
          background-size: 0.65em auto;
     }

     select:hover {
          filter: brightness(1.2);
     }

     select:focus {
          outline: none;
          border-color: var(--btn-primary-bg, #007bff);
          background-color: rgba(255, 255, 255, 0.2);
     }
</style>
