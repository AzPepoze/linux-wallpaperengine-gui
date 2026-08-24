async function run(command: string[], env: Record<string, string> = {}) {
	const proc = Bun.spawn(command, {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		env: { ...process.env, ...env },
	});
	const code = await proc.exited;
	if (code !== 0) process.exit(code);
}

await run(["bun", "run", "build:backend"]);
await run(["bun", "run", "build:native"]);

const vite = Bun.spawn(["bun", "run", "dev:frontend"], {
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
	env: process.env,
});

await Bun.sleep(800);

const backend = Bun.spawn(["./build/backend/linux-wallpaperengine-gui", ...process.argv.slice(2)], {
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
	env: {
		...process.env,
		LWE_GUI_DEV_URL: "http://127.0.0.1:5173",
	},
});

const stop = () => {
	try { backend.kill(); } catch {}
	try { vite.kill(); } catch {}
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

const code = await backend.exited;
stop();
process.exit(code);
