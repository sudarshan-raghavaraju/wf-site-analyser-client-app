/**
 * SA-107: Testing Framework & Strategy — framework validation tests
 *
 * Verifies that the testing infrastructure itself is correctly set up:
 * Vitest, React Testing Library, IPC mocks, and E2E scaffolding.
 *
 * These tests act as living documentation of the testing conventions
 * used throughout the project.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Button } from '@/components/Button';

// ---------------------------------------------------------------------------
// TC-01: Vitest runs sample test
// ---------------------------------------------------------------------------
describe('TC-01: Vitest unit testing', () => {
  it('executes a trivial assertion — confirms Vitest is running', () => {
    expect(1 + 1).toBe(2);
  });

  it('supports async/await natively', async () => {
    const result = await Promise.resolve('vitest-async');
    expect(result).toBe('vitest-async');
  });

  it('vi.fn() creates spy functions with call tracking', () => {
    const spy = vi.fn((x: number) => x * 2);
    expect(spy(3)).toBe(6);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(3);
  });
});

// ---------------------------------------------------------------------------
// TC-02: React Testing Library renders component
// ---------------------------------------------------------------------------
describe('TC-02: React Testing Library component testing', () => {
  it('renders a component and queries the DOM by role', () => {
    render(React.createElement(Button, null, 'Click me'));
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('jest-dom matchers work (toBeVisible, className)', () => {
    render(React.createElement(Button, { variant: 'primary' }, 'Primary'));
    const btn = screen.getByRole('button', { name: /primary/i });
    expect(btn).toBeVisible();
    expect(btn.className).toMatch(/bg-/);
  });
});

// ---------------------------------------------------------------------------
// TC-03: Coverage report is configured
// ---------------------------------------------------------------------------
describe('TC-03: Coverage reporting', () => {
  it('vitest.config.ts declares v8 coverage provider', () => {
    const configPath = path.resolve(process.cwd(), 'vitest.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toContain("provider: 'v8'");
  });

  it('coverage thresholds are set to ≥50 for all metrics', () => {
    const configPath = path.resolve(process.cwd(), 'vitest.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toContain('thresholds');
    expect(config).toContain('lines: 50');
    expect(config).toContain('functions: 50');
    expect(config).toContain('branches: 50');
    expect(config).toContain('statements: 50');
  });

  it('lcov reporter is enabled for CI badge integration', () => {
    const configPath = path.resolve(process.cwd(), 'vitest.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toContain('lcov');
  });
});

// ---------------------------------------------------------------------------
// TC-04: IPC mocks intercept window.api calls
// ---------------------------------------------------------------------------
describe('TC-04: IPC mock utilities', () => {
  it('window.api is defined in the test environment', () => {
    expect(window.api).toBeDefined();
  });

  it('getAppVersion mock returns a typed version string', async () => {
    const version = await window.api.getAppVersion();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/\d+\.\d+\.\d+/);
  });

  it('storeSet / storeGet mocks are callable without throwing', async () => {
    await window.api.storeSet('key', 'value');
    await expect(window.api.storeGet('key')).resolves.toBeDefined();
  });

  it('IPC mocks record invocations for assertion', async () => {
    await window.api.getAppVersion();
    expect(window.api.getAppVersion).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-05: E2E infrastructure stub
// ---------------------------------------------------------------------------
describe('TC-05: E2E scaffolding', () => {
  it('playwright.config.ts exists at project root', () => {
    const configPath = path.resolve(process.cwd(), 'playwright.config.ts');
    expect(existsSync(configPath)).toBe(true);
  });

  it('e2e/ directory contains at least one spec file', () => {
    const e2eDir = path.resolve(process.cwd(), 'e2e');
    expect(existsSync(e2eDir)).toBe(true);
    const specPath = path.resolve(e2eDir, 'app.spec.ts');
    expect(existsSync(specPath)).toBe(true);
  });

  it('@playwright/test is available as a dev dependency', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.devDependencies['@playwright/test']).toBeDefined();
    expect(pkg.scripts['test:e2e']).toBeDefined();
  });
});
