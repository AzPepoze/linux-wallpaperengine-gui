import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
	root: ".",
	base: "./",
	publicDir: "src/public",
	build: {
		outDir: "build/frontend",
		emptyOutDir: true,
	},
	plugins: [svelte()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/frontend/svelte"),
			"@shared": path.resolve(__dirname, "./src/frontend/shared"),
		},
	},
});
