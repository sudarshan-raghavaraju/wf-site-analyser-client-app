/**
 * SA-202: Version Check on Launch
 *
 * Tests that the app silently checks for updates on launch, surfaces the
 * blocking force-update modal for mandatory updates, shows a non-blocking
 * optional banner, and gracefully handles version-check failures.
 *
 * Test File: src/renderer/__tests__/lifecycle/VersionCheckOnLaunch.test.tsx
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VersionChecker } from '@/components/VersionChecker';

// VersionChecker is a "behaviour" component — it renders nothing when up-to-date
// and renders the ForceUpdateModal when a mandatory update is detected.

// Flush several microtask ticks inside act() so the Promise.all chain in
// VersionChecker (checkForUpdates + getAppVersion) settles under fake timers.
async function flushMicrotasks() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

function renderVersionChecker(overrides: { updateAvailable?: boolean; mandatory?: boolean } = {}) {
  vi.mocked(window.api.checkForUpdates).mockResolvedValue({
    updateAvailable: overrides.updateAvailable ?? false,
    mandatory: overrides.mandatory ?? false,
    version: overrides.updateAvailable ? '2.5.0' : undefined,
  });
  return render(<VersionChecker />);
}

describe('SA-202 – Version Check on Launch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore a cleanup function so the onUpdateStatus unsubscribe call doesn't throw.
    vi.mocked(window.api.onUpdateStatus).mockReturnValue(() => {});
  });

  // TC-01: Version check runs on mount
  it('TC-01: calls checkForUpdates IPC on component mount', async () => {
    renderVersionChecker();
    await waitFor(() => {
      expect(window.api.checkForUpdates).toHaveBeenCalledTimes(1);
    });
  });

  // TC-02: No UI shown when up-to-date — awaits both IPC calls to avoid act() warnings
  it('TC-02: renders nothing when app is up-to-date', async () => {
    const { container } = renderVersionChecker({ updateAvailable: false });
    await waitFor(() => {
      expect(window.api.checkForUpdates).toHaveBeenCalled();
      expect(window.api.getAppVersion).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  // TC-03: Blocking modal shown for mandatory update
  it('TC-03: renders ForceUpdateModal when a mandatory update is detected', async () => {
    renderVersionChecker({ updateAvailable: true, mandatory: true });
    await waitFor(() => {
      expect(screen.getByText(/update required/i)).toBeInTheDocument();
    });
  });

  // TC-04 (ticket): Non-mandatory update shows optional banner without blocking modal
  it('TC-04: renders an optional update notification for non-mandatory updates', async () => {
    renderVersionChecker({ updateAvailable: true, mandatory: false });
    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // SA-202 TC-04 (ticket): Warning banner when update server is unreachable
  it('TC-04-server-unreachable: shows a warning alert when the update server is unreachable', async () => {
    vi.mocked(window.api.checkForUpdates).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<VersionChecker />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/unable to check for updates/i)).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  // TC-05: Graceful handling — no crash and warning is shown
  it('TC-05: handles version check network failure gracefully without crashing', async () => {
    vi.mocked(window.api.checkForUpdates).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<VersionChecker />);
    await waitFor(() => expect(window.api.checkForUpdates).toHaveBeenCalled());
    expect(container).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  // SA-202 TC-06: Background check every 30 minutes
  it('TC-06: re-checks for updates every 30 minutes', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(window.api.checkForUpdates).mockResolvedValue({ updateAvailable: false });

      render(<VersionChecker />);

      // Flush initial promises
      await act(async () => {
        await Promise.resolve();
      });
      expect(window.api.checkForUpdates).toHaveBeenCalledTimes(1);

      // Advance 30 minutes and flush the resulting promises
      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000);
        await Promise.resolve();
      });
      expect(window.api.checkForUpdates).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  // SA-201 TC-05 (integration): saveAutoSave is called before installUpdate
  it('TC-05-integration: auto-saves before calling installUpdate when install is triggered', async () => {
    vi.mocked(window.api.checkForUpdates).mockResolvedValue({
      updateAvailable: true,
      mandatory: true,
      latestVersion: '2.5.0',
      currentVersion: '2.4.0',
    });

    render(<VersionChecker />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /restart and update/i })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole('button', { name: /restart and update/i }));

    await waitFor(() => {
      expect(window.api['analysis:saveAutoSave']).toHaveBeenCalled();
      expect(window.api.installUpdate).toHaveBeenCalled();
    });

    const saveOrder = vi.mocked(window.api['analysis:saveAutoSave']).mock.invocationCallOrder[0];
    const installOrder = vi.mocked(window.api.installUpdate).mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(installOrder);
  });

  // Regression (review finding #1): a background poll must never dismiss the
  // blocking modal once a mandatory update has been surfaced.
  it('keeps the force-update modal open when a later poll reports no update', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(window.api.checkForUpdates).mockResolvedValue({
        updateAvailable: true,
        mandatory: true,
        latestVersion: '2.5.0',
        currentVersion: '2.4.0',
      });

      render(<VersionChecker />);
      await flushMicrotasks();
      expect(screen.getByText(/update required/i)).toBeInTheDocument();

      // Server now reports the client is up to date (e.g. version bumped elsewhere).
      vi.mocked(window.api.checkForUpdates).mockResolvedValue({ updateAvailable: false });

      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });
      await flushMicrotasks();

      // The mandatory modal must remain — a force update is never silently dismissed.
      expect(screen.getByText(/update required/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // Regression (review finding #2): minimumVersion enforcement must not depend on
  // the resolve order of checkForUpdates vs getAppVersion. Even when the server
  // omits currentVersion and mandatory is false, a local version below the floor
  // must still force the blocking modal.
  it('forces the modal when the local version is below minimumVersion and the server omits currentVersion', async () => {
    vi.mocked(window.api.getAppVersion).mockResolvedValue('2.3.0');
    vi.mocked(window.api.checkForUpdates).mockResolvedValue({
      updateAvailable: true,
      mandatory: false,
      latestVersion: '3.0.0',
      minimumVersion: '2.5.0',
      // server does NOT echo currentVersion — local getAppVersion is the only source
    });

    render(<VersionChecker />);
    await waitFor(() => expect(screen.getByText(/update required/i)).toBeInTheDocument());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
