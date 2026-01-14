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
          background: var(--bg-surface-active);
          border-radius: var(--radius-full);
          appearance: none;
          outline: none;
          cursor: pointer;
          transition: var(--transition-base);

          &:hover {
               background: var(--border-color-hover);

               &::-webkit-slider-thumb {
                    transform: scale(1.1);
               }
          }

          &::-webkit-slider-thumb {
               appearance: none;
               width: 18px;
               height: 18px;
               background: var(--btn-primary-bg);
               border-radius: 50%;
               cursor: pointer;
               transition: var(--transition-base);
               box-shadow: var(--shadow-sm);
               border: 2px solid #fff;
          }

          &::-moz-range-thumb {
               width: 18px;
               height: 18px;
               background: var(--btn-primary-bg);
               border-radius: 50%;
               cursor: pointer;
               transition: var(--transition-base);
               box-shadow: var(--shadow-sm);
               border: 2px solid #fff;
          }
     }
</style>
