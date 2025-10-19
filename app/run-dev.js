/**
 * This is a script to ensure `neu run` and `neu build` commands can be used correctly.
 */

import { execSync } from "child_process";
import { existsSync } from "node:fs";

const distPath = "./dist/";

// Check if dist/ exists, and if not, build first
if (!existsSync(distPath)) {
	console.log("Building project...");
	execSync("npm run build", { stdio: "inherit" });
}

// Now run dev
console.log("Starting dev server...");
execSync("npm run dev", { stdio: "inherit" });
