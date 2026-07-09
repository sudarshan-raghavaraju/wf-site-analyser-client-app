import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/renderer/__tests__/setup.ts', 'src/renderer/__tests__/setup-matchers.ts'],
    include: [
      'src/renderer/__tests__/**/*.{ts,tsx}',
      'src/renderer/components/**/*.test.{ts,tsx}',
      'src/shared/**/__tests__/**/*.{ts,tsx}',
      'src/main/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'out/**',
      '**/*.spec.ts',
      'src/renderer/__tests__/setup.ts',
      'src/renderer/__tests__/setup-matchers.ts',
      'src/renderer/__tests__/auth/**',
      'src/renderer/__tests__/features/**',
      'src/renderer/__tests__/lifecycle/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/templates/**',
        'src/renderer/index.tsx',
        'src/main/index.ts',
        'src/preload/index.ts',
        'src/renderer/features/**',
        'src/renderer/services/**',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@preload': path.resolve(__dirname, 'src/preload'),
    },
  },
});
