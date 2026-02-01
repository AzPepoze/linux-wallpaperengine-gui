import { logger } from "../logger";

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
          logger.backend(
               "Configuring Electron to use XWayland for better compatibility",
          );
          return {
               OZONE_PLATFORM: "x11",
               GDK_BACKEND: "x11",
               ELECTRON_OZONE_PLATFORM_HINT: "x11",
          };
     }

     return {};
}
