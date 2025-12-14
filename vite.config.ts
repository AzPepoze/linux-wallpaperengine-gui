import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import electron from "vite-plugin-electron/simple";
import path from "path";

export default defineConfig({
     root: ".",
     publicDir: "src/public",
     build: {
          outDir: "build",
     },
     plugins: [
          svelte(),
          electron({
               main: {
                    entry: "src/main/main.ts",
                    vite: {
                         build: {
                              outDir: "build/electron",
                         },
                    },
               },
               preload: {
                    input: "src/main/preload.ts",
                    vite: {
                         build: {
                              outDir: "build/electron",
                         },
                    },
               },
               renderer: {},
          }),
     ],
     resolve: {
          alias: {
               "@": path.resolve(__dirname, "./src/frontend"),
          },
     },
});
