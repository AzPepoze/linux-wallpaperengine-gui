<script lang="ts">
     export let value: number;
     export let min: number = 0;
     export let max: number = 100;
     export let id: string = "";
</script>

<div class="range-wrapper">
     <input type="range" {id} bind:value {min} {max} on:input />
</div>

<style lang="scss">
     .range-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 140px;
     }

     input[type="range"] {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          appearance: none;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
               background: rgba(255, 255, 255, 0.15);
               
               &::-webkit-slider-thumb {
                    transform: scale(1.1);
               }
          }

          &::-webkit-slider-thumb {
               appearance: none;
               width: 18px;
               height: 18px;
               background: var(--btn-primary-bg, #007bff);
               border-radius: 50%;
               cursor: pointer;
               transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
               box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
               border: 2px solid #fff;
          }

          &::-moz-range-thumb {
               width: 18px;
               height: 18px;
               background: var(--btn-primary-bg, #007bff);
               border-radius: 50%;
               cursor: pointer;
               transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
               box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
               border: 2px solid #fff;
          }
     }
</style>
