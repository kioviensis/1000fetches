import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    isolate: true,
    environment: 'node',
    setupFiles: ['./src/testing/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/testing/**', '**/*.test.ts'],
      // Ensure 100% coverage
      all: true,
      include: ['src/**/*.ts'],
      // Optimize coverage collection
      clean: true,
      cleanOnRerun: true,
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
})
