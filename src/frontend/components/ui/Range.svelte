<script lang="ts">
     export let value: number;
     export let min: number = 0;
     export let max: number = 100;
     export let id: string = "";
</script>

<input type="range" {id} bind:value {min} {max} on:input />

<style>
     input[type="range"] {
          flex: 1;
          max-width: 200px;
          margin: 0;
          cursor: pointer;
          transition: all 0.2s;
     }

     input[type="range"]:hover {
          filter: brightness(1.2);
     }
</style>
