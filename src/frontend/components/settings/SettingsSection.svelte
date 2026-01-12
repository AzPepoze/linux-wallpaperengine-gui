<script lang="ts">
     export let title: string;
     export let description: string = "";
</script>

<section class="settings-section" {...$$restProps}>
     <div class="section-header">
          <h3>{title}</h3>
          {#if description}
               <p>{description}</p>
          {/if}
     </div>
     <div class="section-content">
          <slot />
     </div>
</section>

<style lang="scss">
     .settings-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fade-in 0.3s ease-out;
     }

     .section-header {
          text-align: left;
          
          h3 {
               margin: 0;
               font-size: 1.25em;
               font-weight: 700;
               color: #fff;
               letter-spacing: -0.01em;
          }

          p {
               margin: 6px 0 0 0;
               font-size: 0.9em;
               color: rgba(255, 255, 255, 0.5);
          }
     }

     .section-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
     }

     @keyframes fade-in {
          from {
               opacity: 0;
               transform: translateY(10px);
          }
          to {
               opacity: 1;
               transform: translateY(0);
          }
     }
</style>
