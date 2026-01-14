<script lang="ts">
     export let checked: boolean = false;
     export let id: string =
          "toggle-" + Math.random().toString(36).substr(2, 9);
     export let onChange: (checked: boolean) => void = () => {};

     function handleChange(event: Event) {
          const target = event.target as HTMLInputElement;
          checked = target.checked;
          onChange(checked);
     }
</script>

<label class="toggle-switch" for={id}>
     <input type="checkbox" {id} {checked} on:change={handleChange} />
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
          background-color: var(--bg-surface-active);
          transition: var(--transition-slow);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);

          &:before {
               position: absolute;
               content: "";
               height: 18px;
               width: 18px;
               left: 2px;
               bottom: 2px;
               background-color: #fff;
               transition: var(--transition-slow);
               border-radius: 50%;
               box-shadow: var(--shadow-sm);
          }
     }

     input:checked + .slider {
          background-color: var(--btn-primary-bg);
          border-color: var(--border-color);

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
