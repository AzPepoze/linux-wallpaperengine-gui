import { logger } from "./logger";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const getScreens = async (): Promise<{
     success: boolean;
     screens?: string[];
     error?: string;
}> => {
     try {
          const { stdout, stderr } = await execAsync("xrandr --query");

          if (stderr) {
               logger.backend(`xrandr stderr: ${stderr}`);
          }

          if (!stdout) {
               return {
                    success: false,
                    error: "xrandr --query returned no output.",
               };
          }

          const lines = stdout.split("\n");
          const screenNames: string[] = [];

          for (const line of lines) {
               if (line.includes(" connected")) {
                    const screenName = line.split(" ")[0];
                    screenNames.push(screenName);
               }
          }

          if (screenNames.length === 0) {
               return {
                    success: false,
                    error: "No connected screens found by xrandr.",
               };
          }

          return { success: true, screens: screenNames };
     } catch (err: unknown) {
          const error = err instanceof Error ? err.message : String(err);
          logger.backend(`Error in getScreens: ${error}`);
          return { success: false, error };
     }
};
