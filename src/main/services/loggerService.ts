import { ipcMain } from "electron";
import { logger } from "../../backend/logger";
import { IPC_LOG_CHANNEL } from "../../shared/constants";

export function registerLoggerService() {
     ipcMain.on(IPC_LOG_CHANNEL, (_, type: string, ...args: any[]) => {
          if (type == "frontend") logger.frontend(...args);
     });
}
