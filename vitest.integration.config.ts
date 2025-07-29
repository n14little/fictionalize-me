import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    testTimeout: 10000, // Longer timeout for database operations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run integration tests sequentially to avoid database conflicts
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.next/**',
        '**/tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname),
      '@/lib': resolve(__dirname, './lib'),
      '@/components': resolve(__dirname, './components'),
      '@/app': resolve(__dirname, './app'),
    },
  },
});
