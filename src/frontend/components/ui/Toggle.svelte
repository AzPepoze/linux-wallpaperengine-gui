<script lang="ts">
     export let checked: boolean = false;
     export let id: string = "";
</script>

<label class="toggle-switch" for={id}>
     <input type="checkbox" {id} bind:checked on:change />
     <span class="slider"></span>
</label>

<style lang="scss">
     .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;

          input {
               opacity: 0;
               width: 0;
               height: 0;
               position: absolute;
          }
     }

     .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);

          &:before {
               position: absolute;
               content: "";
               height: 18px;
               width: 18px;
               left: 2px;
               bottom: 2px;
               background-color: #fff;
               transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
               border-radius: 50%;
               box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
     }

     input:checked + .slider {
          background-color: var(--btn-primary-bg, #007bff);
          border-color: rgba(255, 255, 255, 0.1);

          &:before {
               transform: translateX(20px);
          }
     }

     input:focus + .slider {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
     }

     .toggle-switch:hover .slider {
          filter: brightness(1.2);
     }
</style>
