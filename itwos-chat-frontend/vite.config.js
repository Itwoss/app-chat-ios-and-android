import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const index = join(outDir, 'index.html')
      const notFound = join(outDir, '404.html')
      if (existsSync(index)) {
        copyFileSync(index, notFound)
        console.log('[vite] Copied index.html to 404.html')
      }
    }
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), copyIndexTo404()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
  // country-state-city is lazy-loaded in useLocationData.js (not in main bundle; fixes iOS)

  build: {
    target: 'es2017',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Smart auto-splitting based on npm package name
            const parts = id.split('node_modules/')[1].split('/')
            const pkg = parts[0].startsWith('@')
              ? parts.slice(0, 2).join('_')
              : parts[0]
            return `npm-${pkg}`
          }
        }
      }
    }
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
