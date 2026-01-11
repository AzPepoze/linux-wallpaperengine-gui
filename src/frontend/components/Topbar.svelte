<script lang="ts">
     import Button from "./ui/Button.svelte";
     import LogsIcon from "../icons/LogsIcon.svelte";
     import SettingIcon from "../icons/SettingIcon.svelte";
     import HomeIcon from "../icons/HomeIcon.svelte";
     import { activeView } from "../scripts/ui";

     function setView(view: "wallpapers" | "logs" | "settings") {
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
          </Button>

          <Button
               variant={$activeView === "logs" ? "primary" : "secondary"}
               on:click={() => setView("logs")}
               title="Logs"
          >
               <LogsIcon width="20" height="20" />
          </Button>

          <Button
               variant={$activeView === "settings" ? "primary" : "secondary"}
               on:click={() => setView("settings")}
               title="Settings"
          >
               <SettingIcon width="20" height="20" />
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
          background: var(--top-bar-bg);
          border-radius: 0 0 12px 12px;
     }

     .center-actions {
          display: flex;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
     }
</style>
