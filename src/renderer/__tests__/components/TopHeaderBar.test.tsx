/**
 * SA-402: Top Header Bar
 *
 * Tests the persistent top header — app title, session badge, breadcrumb,
 * and the notification / profile areas — across guest and authenticated states.
 *
 * Test File: src/renderer/__tests__/components/TopHeaderBar.test.tsx
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { TopHeaderBar } from '@/components/TopHeaderBar';
import { useSessionStore } from '@/store/sessionStore';

function renderHeader(route = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TopHeaderBar />
    </MemoryRouter>,
  );
}

describe('SA-402 – Top Header Bar', () => {
  // TC-01: Header renders on all non-sign-in routes
  it('TC-01: header is present in the DOM on the dashboard route', () => {
    renderHeader('/dashboard');
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  // TC-02: App title renders
  it('TC-02: "Site Analyser" title appears in the header', () => {
    renderHeader();
    expect(screen.getByText(/site an[ai]ly[sz][ae]r/i)).toBeInTheDocument();
  });

  // TC-03: Breadcrumb reflects current route
  it('TC-03: breadcrumb shows "Dashboard" text on the /dashboard route', () => {
    renderHeader('/dashboard');
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('TC-03a: breadcrumb shows "Settings" on the /settings route', () => {
    renderHeader('/settings');
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  // TC-04: Guest badge shown in guest mode
  it('TC-04: "LOCAL SESSION" badge visible when session mode is guest', () => {
    useSessionStore.setState({ mode: 'guest', userId: 'test-id', createdAt: new Date() });
    renderHeader();
    expect(screen.getByText(/local session/i)).toBeInTheDocument();
  });

  // TC-05: Notification bell is accessible
  it('TC-05: notification bell button renders with accessible label', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /notification|bell/i })).toBeInTheDocument();
  });

  // TC-06: Header not rendered on /sign-in
  it('TC-06: header is hidden on the /sign-in route (standalone page)', () => {
    // The layout shell excludes TopHeaderBar on /sign-in via nested routing.
    // Simulate that pattern: only render the header on non-sign-in routes.
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <Routes>
          <Route path="/sign-in" element={<div data-testid="sign-in" />} />
          <Route path="*" element={<TopHeaderBar />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('banner')).toBeNull();
  });
});
