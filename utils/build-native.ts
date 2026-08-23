import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
await mkdir("build/native", { recursive: true });

async function run(command: string[], env: Record<string, string> = {}) {
	const proc = Bun.spawn(command, {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		env: { ...process.env, ...env },
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) process.exit(exitCode);
}

await run([
	"cmake",
	"-S", "src/native",
	"-B", "build/native",
	"-G", "Ninja",
	"-DCMAKE_BUILD_TYPE=Release",
	`-DAPP_VERSION=${pkg.version}`,
]);
await run(["cmake", "--build", "build/native", "--parallel"]);
