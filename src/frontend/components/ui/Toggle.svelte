<script lang="ts">
     export let checked: boolean = false;
     export let id: string = "";
</script>

<label class="toggle-switch" for={id}>
     <input type="checkbox" {id} bind:checked on:change />
     <span class="slider"></span>
</label>

<style>
     .toggle-switch {
          position: relative;
          display: inline-block;
          width: 46px;
          height: 24px;
          flex-shrink: 0;
     }

     .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
     }

     .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.4s;
          border-radius: 24px;
     }

     .toggle-switch:hover .slider {
          filter: brightness(1.2);
     }

     .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
     }

     input:checked + .slider {
          background-color: var(--btn-primary-bg, #007bff);
     }

     input:focus + .slider {
          box-shadow: 0 0 1px var(--btn-primary-bg, #007bff);
     }

     input:checked + .slider:before {
          transform: translateX(22px);
     }
</style>
