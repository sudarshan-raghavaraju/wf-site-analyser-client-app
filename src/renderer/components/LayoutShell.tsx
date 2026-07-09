import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useSessionStore } from '../store/sessionStore';

import { SideNavRail } from './SideNavRail';
import { TopHeaderBar } from './TopHeaderBar';

export function LayoutShell(): React.ReactElement {
  const initGuestSession = useSessionStore((s) => s.initGuestSession);

  useEffect(() => {
    let cancelled = false;
    async function initSession() {
      try {
        const existing = await window.api.storeGet('sessionId');
        if (cancelled) return;
        if (typeof existing === 'string' && existing) {
          initGuestSession(existing);
        } else {
          const newId = crypto.randomUUID();
          await window.api.storeSet('sessionId', newId);
          if (!cancelled) initGuestSession(newId);
        }
      } catch {
        // IPC unavailable — leave session uninitialised; app can degrade gracefully
      }
    }
    initSession();
    return () => {
      cancelled = true;
    };
  }, [initGuestSession]);

  return (
    <div id="app-root" className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900">
      <SideNavRail />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeaderBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
