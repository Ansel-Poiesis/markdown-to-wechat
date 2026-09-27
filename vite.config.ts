import { fileURLToPath, URL } from 'node:url'
import { relative, resolve, sep } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const artifactDirectories = new Set(['audit', 'browser-smoke', 'design', 'docs'])

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',
  server: {
    watch: {
      // Generated media may be locked on Windows. Skip only these repository-root
      // artifact trees; Vite can still serve their files over HTTP for review.
      ignored: (watchedPath: string) => {
        const repositoryPath = relative(projectRoot, resolve(projectRoot, watchedPath))
        return artifactDirectories.has(repositoryPath.split(sep)[0] ?? '')
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
