import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import electron from "vite-plugin-electron/simple";
import path from "path";

export default defineConfig({
	root: ".",
	publicDir: "src/public",
	build: {
		outDir: "build/frontend",
	},
	plugins: [
		svelte(),
		electron({
			main: {
				entry: "src/frontend/main/main.ts",
				vite: {
					build: {
						outDir: "build/frontend/electron",
						rollupOptions: {
							external: ["steamworks.js"],
						},
					},
				},
			},
			preload: {
				input: "src/frontend/main/preload.ts",
				vite: {
					build: {
						outDir: "build/frontend/electron",
						rollupOptions: {
							external: ["steamworks.js"],
						},
					},
				},
			},
			renderer: {},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/frontend/svelte"),
		},
	},
});
