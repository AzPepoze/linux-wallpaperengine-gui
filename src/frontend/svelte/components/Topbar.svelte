<script lang="ts">
     import Button from "./ui/Button.svelte";
     import LogsIcon from "../icons/LogsIcon.svelte";
     import SettingIcon from "../icons/SettingIcon.svelte";
     import HomeIcon from "../icons/HomeIcon.svelte";
     import WorkshopIcon from "../icons/WorkshopIcon.svelte";
     import { activeView } from "../scripts/ui";

     function setView(view: "wallpapers" | "logs" | "settings" | "workshop") {
          activeView.set(view);
     }
</script>

<div class="topbar">
     <div class="center-actions">
          <Button
               variant={$activeView === "wallpapers" ? "primary" : "secondary"}
               on:click={() => setView("wallpapers")}
               title="Wallpapers"
          >
               <HomeIcon width="20" height="20" />
               <span>Home</span>
          </Button>

          <Button
               variant={$activeView === "workshop" ? "primary" : "secondary"}
               on:click={() => setView("workshop")}
               title="Workshop"
          >
               <WorkshopIcon width="20" height="20" />
               <span>Workshop</span>
          </Button>

          <Button
               variant={$activeView === "logs" ? "primary" : "secondary"}
               on:click={() => setView("logs")}
               title="Logs"
          >
               <LogsIcon width="20" height="20" />
               <span>Logs</span>
          </Button>

          <Button
               variant={$activeView === "settings" ? "primary" : "secondary"}
               on:click={() => setView("settings")}
               title="Settings"
          >
               <SettingIcon width="20" height="20" />
               <span>Settings</span>
          </Button>
     </div>
</div>

<style lang="scss">
     .topbar {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px 20px;
          width: 100%;
          box-sizing: border-box;
          flex-shrink: 0;
          min-height: 60px;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
     }

     .center-actions {
          display: flex;
          gap: 12px;
          padding: 6px;
          border-radius: var(--radius-lg);
     }
</style>
