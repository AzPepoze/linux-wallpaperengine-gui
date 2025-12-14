<script lang="ts">
     export let title: string;
     export let full: boolean = false;
</script>

<div class="settings-section" class:full {...$$restProps}>
     <h3>{title}</h3>
     <slot />
</div>

<style>
     .settings-section {
          background-color: rgb(37, 37, 37);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-sizing: border-box;
          height: 100%;
     }

     h3 {
          margin-top: 0;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 10px;
          font-size: 1.2em;
          color: #eee;
          text-align: left;
     }

     .full {
          width: 100%;
     }
</style>
