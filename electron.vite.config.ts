import { defineConfig } from 'electron-vite'

/** electron-vite config: default entry layout under src/main, src/preload, src/renderer. */
export default defineConfig({
  main: {
    build: {
      minify: 'esbuild',
      sourcemap: false
    }
  },
  preload: {
    build: {
      minify: 'esbuild',
      sourcemap: false
    }
  },
  renderer: {
    build: {
      minify: 'esbuild',
      sourcemap: false,
      cssMinify: true
    }
  }
})
