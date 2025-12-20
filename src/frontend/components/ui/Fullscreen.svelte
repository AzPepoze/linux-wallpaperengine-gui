<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  export let onClose: () => void;
  export let duration: number = 200;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  // Focus the container on mount to capture keyboard events
  let container: HTMLDivElement;
  onMount(() => {
    container?.focus();
  });
</script>

<div
  class="fullscreen-overlay"
  bind:this={container}
  transition:fade={{ duration }}
  on:click={onClose}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
>
  <div
    class="fullscreen-content"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="presentation"
  >
    <slot />
  </div>
</div>

<style lang="scss">
  .fullscreen-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    outline: none; /* Remove focus outline */
  }

  .fullscreen-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }
</style>
