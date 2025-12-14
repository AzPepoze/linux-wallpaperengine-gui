<script lang="ts">
     import { fly } from "svelte/transition";
     import Settings from "./Settings.svelte";
     import { createEventDispatcher } from "svelte";

     const dispatch = createEventDispatcher();

     function close() {
          dispatch("close");
     }
</script>

<div
     transition:fly={{ y: -20, duration: 300 }}
     class="modal-overlay"
     role="button"
     tabindex="0"
     on:click={close}
     on:keydown={(e) => {
          if (e.key === "Escape") {
               close();
          }
     }}
>
     <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          on:click|stopPropagation
     >
          <button
               class="modal-close-btn"
               on:click={close}
               aria-label="Close settings"
          >
               &times;
          </button>
          <Settings />
     </div>
</div>

<style lang="scss">
     :root {
          --modal-overlay-bg: rgba(0, 0, 0, 0.75);
          --modal-content-bg: #2a2a2a;
          --modal-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          --modal-close-color: #aaa;
          --modal-close-hover-color: #fff;
     }

     .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: var(--modal-overlay-bg);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
     }

     .modal-content {
          background-color: var(--modal-content-bg);
          padding: 25px 35px;
          border-radius: 15px;
          box-shadow: var(--modal-shadow);
          position: relative;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
     }

     .modal-close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 2.2em;
          cursor: pointer;
          color: var(--modal-close-color);
          line-height: 1;
          transition: color 0.2s ease-in-out;

          &:hover {
               color: var(--modal-close-hover-color);
          }
     }
</style>
