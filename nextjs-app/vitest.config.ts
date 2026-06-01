import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // @ts-expect-error - Vite plugin versions conflict but work at runtime
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    exclude: [...configDefaults.exclude, 'e2e/**/*']
  }
})
