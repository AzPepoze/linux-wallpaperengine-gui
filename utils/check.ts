import { spawn } from "child_process";
import { performance } from "perf_hooks";

async function runCommand(
     command: string,
     args: string[],
     name: string,
     dir: string = ".",
): Promise<{ success: boolean; duration: number }> {
     console.log(`\x1b[36m▶ Running ${name}...\x1b[0m`);
     const start = performance.now();

     return new Promise((resolve) => {
          const proc = spawn(command, args, {
               stdio: "inherit",
               shell: true,
               cwd: dir,
          });

          proc.on("close", (code) => {
               const duration = (performance.now() - start) / 1000;
               if (code === 0) {
                    console.log(
                         `\x1b[32m✔ ${name} passed in ${duration.toFixed(2)}s\x1b[0m\n`,
                    );
                    resolve({ success: true, duration });
               } else {
                    console.log(
                         `\x1b[31m✘ ${name} failed in ${duration.toFixed(2)}s (exit code ${code})\x1b[0m\n`,
                    );
                    resolve({ success: false, duration });
               }
          });
     });
}

async function main() {
     const args = process.argv.slice(2);
     const runFrontend = args.includes("--frontend") || args.length === 0;
     const runBackend = args.includes("--backend") || args.length === 0;

     const totalStart = performance.now();
     console.log("\x1b[1m\x1b[35m=== Project Diagnostics ===\x1b[0m\n");

     const frontendTasks = [
          {
               name: "Frontend (Svelte Check)",
               cmd: "pnpm",
               args: ["exec", "svelte-check", "--tsconfig", "./tsconfig.json"],
          },
          {
               name: "Frontend (TypeScript)",
               cmd: "pnpm",
               args: ["exec", "tsc", "-p", "tsconfig.json"],
          },
     ];

     const backendTasks = [
          {
               name: "Backend (Go Vet)",
               cmd: "go",
               args: ["vet", "./..."],
               dir: "src/backend",
          },
          {
               name: "Backend (Golangci-lint)",
               cmd: "golangci-lint",
               args: ["run"],
               dir: "src/backend",
          },
          {
               name: "Backend (Go Test)",
               cmd: "go",
               args: ["test", "./..."],
               dir: "src/backend",
          },
     ];

     const tasks = [
          ...(runFrontend ? frontendTasks : []),
          ...(runBackend ? backendTasks : []),
     ];

     if (tasks.length === 0) {
          console.log(
               "\x1b[33mNo tasks selected. Use --frontend, --backend, or no flags for all.\x1b[0m",
          );
          process.exit(0);
     }

     let allSuccess = true;
     const results: { name: string; success: boolean; duration: number }[] = [];

     for (const task of tasks) {
          const result = await runCommand(
               task.cmd,
               task.args,
               task.name,
               task.dir,
          );
          results.push({ name: task.name, ...result });
          if (!result.success) allSuccess = false;
     }

     const totalDuration = (performance.now() - totalStart) / 1000;

     console.log("\x1b[1m\x1b[35m=== Summary ===\x1b[0m");
     results.forEach((r) => {
          const status = r.success
               ? "\x1b[32mPASS\x1b[0m"
               : "\x1b[31mFAIL\x1b[0m";
          console.log(
               `${status} | ${r.name.padEnd(25)} | ${r.duration.toFixed(2)}s`,
          );
     });

     console.log(
          `\n\x1b[1mTotal duration: ${totalDuration.toFixed(2)}s\x1b[0m`,
     );

     if (allSuccess) {
          console.log("\n\x1b[42m\x1b[30m ALL SELECTED CHECKS PASSED \x1b[0m");
          process.exit(0);
     } else {
          console.log("\n\x1b[41m\x1b[37m SOME CHECKS FAILED \x1b[0m");
          process.exit(1);
     }
}

main().catch((err) => {
     console.error(err);
     process.exit(1);
});
