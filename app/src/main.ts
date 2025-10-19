import "./app.scss";
import { mount } from "svelte";
import App from "./App.svelte";
import * as Neutralino from "@neutralinojs/lib";
import { killWallpaperEngineProcess } from "./core/wallpaperService";

console.log("Running Main");

// Mount the Svelte app
const app = mount(App, {
     target: document.getElementById("app")!,
});

// Initialization
Neutralino.init();

// Event Listeners
let isVisible = true;

Neutralino.events.on("ready", async () => {
     await Neutralino.os.setTray({
          icon: "/icon.png",
          menuItems: [
               {
                    id: "SHOW_HIDE",
                    text: "Show / Hide App",
               },
               {
                    id: "QUIT",
                    text: "Quit",
               },
          ],
     });

     if (!window.NL_ARGS.includes("--minimized")) {
          await Neutralino.window.show();
          isVisible = true;
     }
});

Neutralino.events.on("trayMenuItemClicked", async (event) => {
     switch (event.detail.id) {
          case "SHOW_HIDE":
               if (isVisible) {
                    await Neutralino.window.hide();
               } else {
                    await Neutralino.window.show();
               }
               isVisible = !isVisible;
               break;
          case "QUIT":
               await killWallpaperEngineProcess();
               await Neutralino.window.hide();
               await Neutralino.app.exit();
               break;
     }
});

Neutralino.events.on("windowClose", async () => {
     await Neutralino.window.hide();
});

export default app;
