import { spawn } from "node:child_process";
import { logger } from "./logger";

interface ActiveWallpaper {
     pid: number;
     command: string;
}

const activeWallpapers = new Map<string, ActiveWallpaper>();

export function updateWallpapers(
     desiredWallpapers: { screen: string; command: string }[]
) {
     const desiredScreens = new Set(desiredWallpapers.map((w) => w.screen));

     for (const [screen] of activeWallpapers.entries()) {
          if (!desiredScreens.has(screen)) {
               killWallpaper(screen);
          }
     }

     for (const desired of desiredWallpapers) {
          const active = activeWallpapers.get(desired.screen);

          if (active) {
               if (active.command === desired.command) {
                    // No change needed
                    logger.backend(
                         `Wallpaper for ${desired.screen} is already running.`
                    );
                    continue;
               } else {
                    // Changed, restart
                    logger.backend(
                         `Updating wallpaper for ${desired.screen}...`
                    );
                    killWallpaper(desired.screen);
                    spawnWallpaper(desired.screen, desired.command);
               }
          } else {
               logger.backend(
                    `Starting wallpaper for ${desired.screen}... (${desired.command})`
               );
               spawnWallpaper(desired.screen, desired.command);
          }
     }
}

function killWallpaper(screen: string) {
     const active = activeWallpapers.get(screen);
     if (active) {
          logger.backend(
               `Killing wallpaper for ${screen} (PID: ${active.pid})`
          );
          try {
               process.kill(-active.pid, "SIGTERM");
          } catch (e) {
               try {
                    process.kill(active.pid, "SIGTERM");
               } catch (e2) {
                    console.error("Failed to kill process", e2);
               }
          }
          activeWallpapers.delete(screen);
     }
}

function spawnWallpaper(screen: string, fullCommand: string) {
     const proc = spawn(fullCommand, {
          shell: true,
          detached: true,
     });

     if (proc.pid) {
          activeWallpapers.set(screen, {
               pid: proc.pid,
               command: fullCommand,
          });
          logger.backend(
               `Started wallpaper for ${screen} with PID ${proc.pid}`
          );
     } else {
          console.error(`Failed to spawn wallpaper for ${screen}`);
     }

     proc.stdout.on("data", (msg) => {
          logger.wallpaper(`${screen}: ${msg.toString().trim()}`);
     });
     proc.stderr.on("data", (msg) => {
          logger.wallpaper(`${screen} (ERROR): ${msg.toString().trim()}`);
     });

     proc.on("error", (err) => {
          console.error(`Error in wallpaper process for ${screen}:`, err);
     });
}
