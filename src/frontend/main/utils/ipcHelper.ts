import { logger } from "../logger";

export function createIPCHandler(
     channel: string,
     callback: (...args: any[]) => any,
) {
     return async (...args: any[]) => {
          logger.ipcReceived(channel, ...args.slice(1));
          return callback(...args);
     };
}

export function extractArgs(args: any[]): any[] {
     return args.slice(1);
}
