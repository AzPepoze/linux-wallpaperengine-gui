<script lang="ts">
     import { onMount, createEventDispatcher } from "svelte";
     import { fly, fade } from "svelte/transition";

     export let value: string;
     export let options: { value: string; label: string }[] = [];
     export let id: string = "";

     const dispatch = createEventDispatcher();

     let isOpen = false;
     let container: HTMLDivElement;

     $: selectedLabel =
          options.find((o) => o.value === value)?.label || "Select option...";

     function toggle() {
          isOpen = !isOpen;
     }

     function selectOption(optionValue: string) {
          value = optionValue;
          isOpen = false;
          dispatch("change", value);
     }

     function handleClickOutside(event: MouseEvent) {
          if (container && !container.contains(event.target as Node)) {
               isOpen = false;
          }
     }

     onMount(() => {
          window.addEventListener("click", handleClickOutside);
          return () => {
               window.removeEventListener("click", handleClickOutside);
          };
     });
</script>

<div class="select-container" {id} bind:this={container}>
     <button
          class="select-trigger"
          class:active={isOpen}
          on:click={toggle}
          type="button"
     >
          <span class="label">{selectedLabel}</span>
          <div class="chevron" class:rotated={isOpen}>
               <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
               >
                    <polyline points="6 9 12 15 18 9"></polyline>
               </svg>
          </div>
     </button>

     {#if isOpen}
          <div
               class="options-dropdown"
               in:fly={{ y: -10, duration: 200 }}
               out:fade={{ duration: 150 }}
          >
               {#each options as option}
                    <button
                         class="option-item"
                         class:selected={option.value === value}
                         on:click={() => selectOption(option.value)}
                         type="button"
                    >
                         {option.label}
                         {#if option.value === value}
                              <div class="check" in:fade>
                                   <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                   >
                                        <polyline points="20 6 9 17 4 12"
                                        ></polyline>
                                   </svg>
                              </div>
                         {/if}
                    </button>
               {/each}
          </div>
     {/if}
</div>

<style lang="scss">
     .select-container {
          width: 100%;
          position: relative;
          user-select: none;
     }

     .select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-surface);
          color: var(--text-color);
          font-size: 0.9em;
          cursor: pointer;
          transition: var(--transition-base);
          text-align: left;

          &:hover {
               background-color: var(--bg-surface-hover);
               border-color: var(--border-color-hover);
          }

          &.active {
               border-color: var(--btn-primary-bg);
               background-color: var(--bg-surface-active);
               box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
          }

          .label {
               flex: 1;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
          }
     }

     .chevron {
          margin-left: 10px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          transition: var(--transition-slow);

          &.rotated {
               transform: rotate(180deg);
               color: var(--btn-primary-bg);
          }
     }

     .options-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% + 20px);
          box-sizing: border-box;
          background: var(--bg-dropdown);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 6px;
          z-index: 1000;
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(10px);
     }

     .option-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: var(--text-color);
          opacity: 0.7;
          font-size: 0.9em;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-base);
          text-align: left;
          box-sizing: border-box;
          white-space: nowrap;
          gap: 12px;

          &:hover {
               background: var(--bg-surface-hover);
               opacity: 1;
          }

          &.selected {
               background: rgba(0, 123, 255, 0.1);
               color: var(--btn-primary-bg);
               opacity: 1;
               font-weight: 600;
          }

          .check {
               display: flex;
               align-items: center;
               color: var(--btn-primary-bg);
          }
     }
</style>
