/**
 * SA-302: Session State Display
 *
 * Tests the SessionIndicator component — the session badge, avatar dropdown,
 * and notification bell rendered in the top header bar.
 *
 * Test File: src/renderer/__tests__/components/SessionIndicator.test.tsx
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { SessionIndicator } from '@/components/SessionIndicator';
import { useSessionStore } from '@/store/sessionStore';

function setGuest(userId = 'fc575ee9-1111-2222-3333-444444444444') {
  useSessionStore.setState({
    mode: 'guest',
    userId,
    createdAt: new Date(),
    profile: null,
    syncStatus: null,
  });
}

function setAuthenticated() {
  useSessionStore.setState({
    mode: 'authenticated',
    userId: 'ims-001',
    createdAt: new Date(),
    profile: { name: 'Jane Doe', email: 'jane@example.com', org: 'Acme' },
    syncStatus: null,
  });
}

describe('SA-302 – Session State Display', () => {
  beforeEach(() => {
    setGuest();
  });

  // TC-01: LOCAL SESSION badge renders in guest mode
  it('TC-01: "LOCAL SESSION" badge is visible in guest mode', () => {
    render(<SessionIndicator />);
    expect(screen.getByText(/local session/i)).toBeInTheDocument();
  });

  // TC-02: Green dot indicator visible
  it('TC-02: green dot element renders inside the badge', () => {
    const { container } = render(<SessionIndicator />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  // TC-03: Generic avatar placeholder shown in guest mode
  it('TC-03: generic avatar button renders when no profile image exists', () => {
    render(<SessionIndicator />);
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
  });

  // TC-04: Avatar dropdown shows About and Settings in guest mode
  it('TC-04: clicking the avatar opens a dropdown with About and Settings', async () => {
    render(<SessionIndicator />);
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
  });

  // TC-05: Notification bell renders
  it('TC-05: notification bell button is present', () => {
    render(<SessionIndicator />);
    expect(screen.getByRole('button', { name: /notification|bell/i })).toBeInTheDocument();
  });

  // TC-06: Session state reads from global store and updates reactively
  it('TC-06: LOCAL SESSION badge disappears when session transitions to authenticated', () => {
    render(<SessionIndicator />);
    expect(screen.getByText(/local session/i)).toBeInTheDocument();

    act(() => {
      setAuthenticated();
    });

    expect(screen.queryByText(/local session/i)).toBeNull();
  });
});
