/**
 * SA-107 TC-05 — E2E stub: Electron app launches and shows the main window.
 *
 * This is a scaffold/template for Electron E2E tests using Playwright.
 *
 * Prerequisites to run:
 *   1. npm run build          — produce out/main/index.js
 *   2. E2E_ENABLED=true npm run test:e2e
 *
 * The tests are skipped by default (no E2E_ENABLED) so they never block CI
 * until the Electron build pipeline is fully set up.
 */

import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

const MAIN_JS = path.join(process.cwd(), 'out', 'main', 'index.js');
const e2eEnabled = process.env.E2E_ENABLED === 'true';

test.describe('SA-107 – Electron app E2E', () => {
  test('TC-05: app launches and the main window appears', async () => {
    test.skip(!e2eEnabled, 'Set E2E_ENABLED=true and run `npm run build` first');

    const app = await electron.launch({ args: [MAIN_JS] });

    try {
      const window = await app.firstWindow();
      await window.waitForLoadState('domcontentloaded');

      // The window should have a non-empty title
      const title = await window.title();
      expect(title).toBeTruthy();

      // The React root should be present
      const appRoot = await window.locator('#app-root').count();
      expect(appRoot).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  test('TC-05b: window is sized correctly on launch', async () => {
    test.skip(!e2eEnabled, 'Set E2E_ENABLED=true and run `npm run build` first');

    const app = await electron.launch({ args: [MAIN_JS] });

    try {
      const window = await app.firstWindow();
      const size = await window.viewportSize();
      expect(size?.width).toBeGreaterThanOrEqual(800);
      expect(size?.height).toBeGreaterThanOrEqual(600);
    } finally {
      await app.close();
    }
  });
});
