import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron E2E tests.
 *
 * Run: npm run test:e2e
 *
 * Requires a production build first: npm run build
 * Then set E2E_ENABLED=true to un-skip the tests.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'coverage/e2e-report', open: 'never' }]],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
