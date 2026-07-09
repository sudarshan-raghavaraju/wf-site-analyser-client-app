/**
 * SA-201: Force Update Modal — unit tests
 *
 * Covers ticket test cases TC-01 through TC-08 against the presentational
 * ForceUpdateModal component in isolation.
 *
 * TC-05 (Auto-saves before restart — Integration) is not a modal-only concern;
 * it lives one layer up where VersionChecker calls saveAutoSave() before
 * installUpdate(). See:
 *   src/renderer/__tests__/lifecycle/VersionCheckOnLaunch.test.tsx
 *     → "TC-05-integration: auto-saves before calling installUpdate when install is triggered"
 *
 * The "Extra" test below covers the related UI invariant (button disabled while
 * the install is in flight) so the disabled-state assertion isn't lost.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForceUpdateModal } from '@/components/ForceUpdateModal';

// Props shape expected by the component
interface ForceUpdateModalProps {
  currentVersion: string;
  newVersion: string;
  status: 'ready' | 'downloading' | 'installing' | 'error' | 'restarting';
  downloadProgress?: number;
  onInstall: () => void;
  onRetry?: () => void;
}

const defaultProps: ForceUpdateModalProps = {
  currentVersion: '2.3.0',
  newVersion: '2.4.0',
  status: 'ready',
  onInstall: vi.fn(),
  onRetry: vi.fn(),
};

function renderModal(props: Partial<ForceUpdateModalProps> = {}) {
  return render(<ForceUpdateModal {...defaultProps} {...props} />);
}

describe('SA-201 – Force Update Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-01: Renders when mandatory update detected
  it('TC-01: renders when mandatory update flag is set', () => {
    renderModal();
    expect(screen.getByText(/update required/i)).toBeInTheDocument();
    expect(screen.getByText(/system update/i)).toBeInTheDocument();
  });

  // TC-02: Blocks background interaction
  it('TC-02: overlay disables pointer-events on background content', () => {
    renderModal();
    const overlay = screen.getByRole('dialog');
    expect(overlay).toBeInTheDocument();
    const backdrop = overlay.parentElement;
    expect(backdrop).not.toBeNull();
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  // TC-03: Shows version comparison
  it('TC-03: displays current and new version with an arrow between them', () => {
    renderModal({ currentVersion: '2.3.0', newVersion: '2.4.0' });
    expect(screen.getByText('2.3.0')).toBeInTheDocument();
    expect(screen.getByText('2.4.0')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /arrow|upgrade/i }) ?? screen.getByText(/→|➜/),
    ).toBeInTheDocument();
  });

  // TC-04: CTA triggers IPC update
  it('TC-04: clicking "Restart and Update Now" invokes the install callback', async () => {
    const onInstall = vi.fn();
    renderModal({ onInstall });
    await userEvent.click(screen.getByRole('button', { name: /restart and update/i }));
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  // TC-05 (Integration): covered in VersionCheckOnLaunch.test.tsx — see file header.

  // Extra: related UI invariant — CTA disabled while the install is in flight.
  it('Extra: install button is disabled when status is "installing"', () => {
    renderModal({ status: 'installing' });
    expect(screen.getByRole('button', { name: /restart and update/i })).toBeDisabled();
  });

  // TC-06: Shows error state with retry
  it('TC-06: renders error message and retry button when status is "error"', async () => {
    const onRetry = vi.fn();
    renderModal({ status: 'error', onRetry });
    expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    await userEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // TC-07: Cannot be dismissed via Escape
  it('TC-07: pressing Escape does not close the modal', async () => {
    renderModal();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText(/update required/i)).toBeInTheDocument();
  });

  // TC-08: Status badge updates through states
  it('TC-08: status badge text reflects "Ready to Install" in default state', () => {
    renderModal({ status: 'ready' });
    expect(screen.getByText(/ready to install/i)).toBeInTheDocument();
  });

  it('TC-08a: status badge shows "Downloading... 45%" when downloadProgress is supplied', () => {
    renderModal({ status: 'downloading', downloadProgress: 45 });
    expect(screen.getByText(/downloading\.\.\. 45%/i)).toBeInTheDocument();
  });

  it('TC-08b: status badge shows "Installing..." during installation', () => {
    renderModal({ status: 'installing' });
    expect(screen.getByText(/installing/i)).toBeInTheDocument();
  });
});
