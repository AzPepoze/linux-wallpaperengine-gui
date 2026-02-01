import { app } from "electron";
import path from "node:path";

export function normalizePath(filePath: string): string {
     if (filePath.startsWith("~")) {
          return path.join(app.getPath("home"), filePath.slice(1));
     }
     return filePath;
}

export function normalizePaths(...paths: string[]): string[] {
     return paths.map(normalizePath);
}
