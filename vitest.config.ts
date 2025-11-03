import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'packages/*/tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 90,
        lines: 85,
      },
    },
    include: ['packages/*/tests/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@tddai/core': path.resolve(__dirname, './packages/core/src'),
      '@tddai/cli': path.resolve(__dirname, './packages/cli/src'),
    },
  },
});
