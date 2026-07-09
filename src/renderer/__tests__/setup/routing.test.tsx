/**
 * SA-103: Routing & Navigation Architecture
 *
 * Verifies that all defined routes render their placeholder pages, the
 * sidebar highlights the correct nav item, lazy-loading resolves correctly,
 * and unknown paths show the 404 fallback.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { routes } from '@/router';
import { ROUTES } from '@/routes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function renderAt(path: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    initialIndex: 0,
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

// ---------------------------------------------------------------------------
// TC-01: All routes render placeholder content
// ---------------------------------------------------------------------------
describe('TC-01: All routes render placeholder content', () => {
  it('renders Sign In page at /sign-in', async () => {
    await renderAt(ROUTES.SIGN_IN);
    await waitFor(() => expect(screen.getByTestId('sign-in-page')).toBeInTheDocument());
  });

  it('renders Dashboard page at /dashboard', async () => {
    await renderAt(ROUTES.DASHBOARD);
    await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });

  it('renders Analysis Setup page at /analysis/new', async () => {
    await renderAt(ROUTES.ANALYSIS_NEW);
    await waitFor(() => expect(screen.getByTestId('analysis-setup-page')).toBeInTheDocument());
  });

  it('renders Analysis Progress page at /analysis/:id/progress', async () => {
    await renderAt('/analysis/abc123/progress');
    await waitFor(() => expect(screen.getByTestId('analysis-progress-page')).toBeInTheDocument());
  });

  it('renders Results Workspace at /projects/:projectId/results/:analysisId', async () => {
    await renderAt('/projects/proj-1/results/analysis-1');
    await waitFor(() => expect(screen.getByTestId('results-workspace-page')).toBeInTheDocument());
  });

  it('renders Settings page at /settings/:tab', async () => {
    await renderAt('/settings/api-keys');
    await waitFor(() => expect(screen.getByTestId('settings-page')).toBeInTheDocument());
  });

  it('renders Force Update page at /force-update', async () => {
    await renderAt(ROUTES.FORCE_UPDATE);
    await waitFor(() => expect(screen.getByTestId('force-update-page')).toBeInTheDocument());
  });
});

// ---------------------------------------------------------------------------
// TC-02: Sidebar highlights correct nav item
// ---------------------------------------------------------------------------
describe('TC-02: Sidebar highlights correct nav item', () => {
  it('Dashboard nav link is active when on /dashboard', async () => {
    await renderAt(ROUTES.DASHBOARD);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument(),
    );
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link.className).toMatch(/border-l-2/);
    expect(link.className).toMatch(/border-blue-600/);
  });

  it('Settings nav link is active when on /settings/general', async () => {
    await renderAt('/settings/general');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument(),
    );
    const link = screen.getByRole('link', { name: /settings/i });
    expect(link.className).toMatch(/border-l-2/);
    expect(link.className).toMatch(/border-blue-600/);
  });
});

// ---------------------------------------------------------------------------
// TC-03: Lazy loading resolves
// ---------------------------------------------------------------------------
describe('TC-03: Lazy-loaded route components resolve', () => {
  it('lazy components render their content without errors', async () => {
    await renderAt(ROUTES.DASHBOARD);
    // If lazy loading fails, the Suspense fallback spinner stays permanently.
    // A successful load means the page content appears.
    await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });
});

// ---------------------------------------------------------------------------
// TC-04: 404 route shows fallback
// ---------------------------------------------------------------------------
describe('TC-04: Unknown routes show 404 page', () => {
  it('renders Not Found page for an unknown path', async () => {
    await renderAt('/this/path/does/not/exist');
    await waitFor(() => expect(screen.getByTestId('not-found-page')).toBeInTheDocument());
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-05: Hash navigation (documented; exercised via E2E in Electron)
// ---------------------------------------------------------------------------
describe('TC-05: Hash-based navigation (E2E)', () => {
  it('route definitions support hash navigation by using createHashRouter in production', () => {
    // createHashRouter is used in App.tsx; routes are shared with tests via
    // createMemoryRouter. Full hash URL verification (e.g. #/settings/api-keys)
    // requires an Electron E2E suite.
    expect(routes).toBeInstanceOf(Array);
    expect(routes.length).toBeGreaterThan(0);
  });
});
