import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
await mkdir("build/native", { recursive: true });

async function run(
	command: string[],
	env: Record<string, string> = {},
	cwd = ".",
) {
	const proc = Bun.spawn(command, {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		cwd,
		env: { ...process.env, ...env },
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) process.exit(exitCode);
}

const buildEnv = { LWE_GUI_VERSION: String(pkg.version) };

// qt_sdkver is deliberately pinned to the Qt 6 major line so Xmake searches
// qmake6 first. xmake.lua also rejects any detected Qt 5 SDK before compiling.
await run(
	["xmake", "f", "-y", "-m", "release", "--qt_sdkver=6.4"],
	buildEnv,
	"src/native",
);
await run(["xmake", "-y", "-v"], buildEnv, "src/native");
