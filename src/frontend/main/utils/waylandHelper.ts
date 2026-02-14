import { logger } from "../logger";
import { isNativeWayland } from "../main";

export function isWaylandSession(): boolean {
     const sessionType = process.env.XDG_SESSION_TYPE || "";
     const waylandDisplay = process.env.WAYLAND_DISPLAY || "";

     const isWayland =
          sessionType.toLowerCase() === "wayland" || waylandDisplay !== "";

     if (isWayland) {
          logger.backend("Wayland session detected");
     }

     return isWayland;
}

export function getWaylandEnvironment(): NodeJS.ProcessEnv {
     const isWayland = isWaylandSession();

     if (isWayland) {
          const ozoneBackend = isNativeWayland ? "wayland" : "x11";
          logger.backend(
               `Configuring Electron to use ${isNativeWayland ? "Wayland" : "XWayland for better compatibility"}`,
          );
          return {
               OZONE_PLATFORM: ozoneBackend,
               GDK_BACKEND: ozoneBackend,
               ELECTRON_OZONE_PLATFORM_HINT: ozoneBackend,
          };
     }

     return {};
}
