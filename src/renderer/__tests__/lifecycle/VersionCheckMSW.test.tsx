import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VersionChecker } from '@/components/VersionChecker';
import { mockServer } from '@main/mocks/server';
import type { UpdateCheckResult } from '@shared/types';

const UPDATE_ENDPOINT = 'https://updates.example.com/api/v1/updates/check';

/**
 * Replace the vi.fn() mock for checkForUpdates with a real fetch so MSW
 * can intercept it. All other window.api methods stay as vi.fn().
 */
function useFetchCheckForUpdates() {
  vi.mocked(window.api.checkForUpdates).mockImplementation(() =>
    fetch(UPDATE_ENDPOINT).then((r) => {
      if (!r.ok) throw new Error(`Update check failed: HTTP ${r.status}`);
      return r.json() as Promise<UpdateCheckResult>;
    }),
  );
}

function respondWith(body: Partial<UpdateCheckResult>, status = 200) {
  mockServer.use(
    http.get(UPDATE_ENDPOINT, () =>
      status >= 400 ? new HttpResponse(null, { status }) : HttpResponse.json(body),
    ),
  );
}

describe('SA-202 – Version Check (MSW / HTTP layer)', () => {
  beforeEach(() => {
    useFetchCheckForUpdates();
    vi.mocked(window.api.onUpdateStatus).mockReturnValue(() => {});
  });

  it('shows the force-update modal when server returns mandatory:true', async () => {
    respondWith({
      updateAvailable: true,
      mandatory: true,
      latestVersion: '3.0.0',
      currentVersion: '2.3.0',
      estimatedUpdateSeconds: 45,
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/update required/i)).toBeInTheDocument());
    expect(screen.getByText('3.0.0')).toBeInTheDocument();
    expect(screen.getByText('2.3.0')).toBeInTheDocument();
  });

  it('shows the optional banner (no modal) when server returns mandatory:false', async () => {
    respondWith({
      updateAvailable: true,
      mandatory: false,
      latestVersion: '2.5.0',
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/update available/i)).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders nothing when server says the app is up-to-date', async () => {
    respondWith({ updateAvailable: false });

    const { container } = render(<VersionChecker />);
    await waitFor(() => expect(window.api.checkForUpdates).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders release notes from the server response', async () => {
    respondWith({
      updateAvailable: true,
      mandatory: true,
      latestVersion: '3.0.0',
      releaseNotes: [
        { category: 'feature', title: 'New RAG engine', description: 'Faster indexing.' },
        { category: 'security', title: 'Auth patch', description: 'Fixes CVE-2026-1234.' },
      ],
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/new rag engine/i)).toBeInTheDocument());
    expect(screen.getByText(/auth patch/i)).toBeInTheDocument();
  });

  it('forces the blocking modal when currentVersion is below minimumVersion even if mandatory is false', async () => {
    respondWith({
      updateAvailable: true,
      mandatory: false,
      latestVersion: '3.0.0',
      minimumVersion: '2.5.0',
      currentVersion: '2.3.0', // below minimum
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/update required/i)).toBeInTheDocument());
    // Should show the blocking modal, not the dismissible optional banner
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows only the optional banner when currentVersion meets minimumVersion', async () => {
    respondWith({
      updateAvailable: true,
      mandatory: false,
      latestVersion: '3.0.0',
      minimumVersion: '2.3.0',
      currentVersion: '2.4.0', // above minimum
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/update available/i)).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Error / degraded server responses
  // -------------------------------------------------------------------------

  it('shows the warning alert when the server returns a 500 error', async () => {
    respondWith({}, 500);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/unable to check for updates/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('shows the warning alert when the network request fails entirely', async () => {
    mockServer.use(http.get(UPDATE_ENDPOINT, () => HttpResponse.error()));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    consoleSpy.mockRestore();
  });

  it('shows the failed alert when server returns updateAvailable:true with no version fields', async () => {
    respondWith({ updateAvailable: true }); // no latestVersion or version
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    consoleSpy.mockRestore();
  });
});
