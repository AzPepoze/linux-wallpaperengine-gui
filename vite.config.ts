import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import electron from 'vite-plugin-electron/simple'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: '.', // Ensure root is still the project root
  publicDir: 'src/public', // Point to the new public directory
  build: {
    outDir: 'build', // Output frontend build to 'build' folder
  },
  plugins: [
    svelte(),
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'build/electron',
          },
        },
      },
      preload: {
        input: 'src/main/preload.ts',
        vite: {
          build: {
            outDir: 'build/electron',
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
        '@': path.resolve(__dirname, './src/frontend'),
    }
  }
})
