<script lang="ts">
     import { hexToRgbFloat, rgbFloatToHex } from "../../utils/colorHelper";

     export let value: string = "1 1 1";
     export let id: string = "";
     export let palette: [number, number, number][] = [];
     export let onInput: (val: string) => void = () => {};

     $: hexValue = rgbFloatToHex(value);

     function handleInput(e: Event) {
          const target = e.target as HTMLInputElement;
          const rgbFloat = hexToRgbFloat(target.value);
          value = rgbFloat;
          onInput(value);
     }

     function handleTextInput(e: Event) {
          const target = e.target as HTMLInputElement;
          value = target.value;
          onInput(value);
     }

     function selectFromPalette(color: [number, number, number]) {
          const rgbFloat = `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)}`;
          value = rgbFloat;
          onInput(value);
     }
</script>

<div class="color-picker-container">
     <div class="picker-main">
          <div class="picker-wrapper">
               <input
                    type="color"
                    {id}
                    value={hexValue}
                    on:change={handleInput}
                    class="picker-input"
               />
               <div
                    class="color-preview"
                    style="background-color: {hexValue}"
               ></div>
          </div>
          <div class="input-wrapper">
               <input
                    type="text"
                    {value}
                    on:input={handleTextInput}
                    class="hex-input"
                    placeholder="1.0 1.0 1.0"
               />
          </div>
     </div>

     {#if palette.length > 0}
          <div class="palette-container custom-scrollbar">
               {#each palette as color}
                    <button
                         class="palette-item"
                         style="background-color: rgb({color.join(',')})"
                         on:click={() => selectFromPalette(color)}
                         title="rgb({color.join(',')})"
                         type="button"
                    ></button>
               {/each}
          </div>
     {/if}
</div>

<style lang="scss">
     .color-picker-container {
          container-type: inline-size;
          container-name: colorpicker;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          color: var(--text-color);
     }

     .picker-main {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
     }

     .picker-wrapper {
          position: relative;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          cursor: pointer;

          .picker-input {
               position: absolute;
               top: 0;
               left: 0;
               width: 100%;
               height: 100%;
               opacity: 0;
               cursor: pointer;
               z-index: 2;
          }

          .color-preview {
               width: 100%;
               height: 100%;
               border-radius: var(--radius-sm);
               border: 1px solid var(--border-color);
               box-shadow: var(--shadow-sm);
               transition: var(--transition-base);
          }

          &:hover .color-preview {
               transform: scale(1.05);
               border-color: var(--border-color-hover);
          }
     }

     .input-wrapper {
          flex-grow: 1;
     }

     .hex-input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-color);
          padding: 8px 14px;
          font-family: monospace;
          font-size: 0.9em;
          outline: none;
          transition: var(--transition-base);

          &:hover {
               background-color: var(--bg-surface-hover);
               border-color: var(--border-color-hover);
          }

          &:focus {
               border-color: var(--btn-primary-bg);
               background: var(--bg-surface-active);
               box-shadow: 0 0 0 3px
                    color-mix(in srgb, var(--btn-primary-bg), transparent 85%);
          }
     }

     .palette-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          background: var(--bg-surface-active);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          max-height: 120px;
          overflow-y: auto;

          &.custom-scrollbar {
               &::-webkit-scrollbar {
                    width: 4px;
               }
               &::-webkit-scrollbar-track {
                    background: transparent;
               }
               &::-webkit-scrollbar-thumb {
                    background: var(--text-muted);
                    border-radius: var(--radius-full);
                    &:hover {
                         background: var(--text-color);
                    }
               }
          }
     }

     /* CSS Container Query to hide palette when width is too small */
     @container colorpicker (width < 160px) {
          .palette-container {
               display: none;
          }
     }

     .palette-item {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1.5px solid var(--border-color);
          cursor: pointer;
          transition: var(--transition-base);
          padding: 0;
          box-shadow: var(--shadow-sm);

          &:hover {
               transform: translateY(-2px);
               border-color: var(--text-color);
               box-shadow: var(--shadow-md);
               z-index: 1;
          }

          &:active {
               transform: translateY(0);
          }
     }
</style>
