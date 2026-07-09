import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, RefreshCw, User } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '../routes';
import { useSessionStore } from '../store/sessionStore';

const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.ANALYSIS_NEW]: 'New Analysis',
  [ROUTES.PROJECTS]: 'Projects',
  [ROUTES.SETTINGS_ROOT]: 'Settings',
  [ROUTES.HELP]: 'Help',
};

function getBreadcrumb(pathname: string): string {
  return (
    ROUTE_LABELS[pathname] ??
    Object.entries(ROUTE_LABELS).find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    ''
  );
}

export function TopHeaderBar(): React.ReactElement {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mode = useSessionStore((s) => s.mode);
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-5">
      <span className="text-[15px] font-bold text-gray-900">WF Site Analyser</span>

      {mode === 'guest' && (
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
          <User size={12} aria-hidden="true" />
          Local Session
        </span>
      )}

      {breadcrumb && <span className="text-xs text-gray-400">{breadcrumb}</span>}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm font-semibold text-indigo-600">Project Alpha</span>

        <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
          <RefreshCw size={12} aria-hidden="true" />
          Syncing
        </span>

        <button
          type="button"
          aria-label="Notifications bell"
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="User menu"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            >
              <User size={18} aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[140px] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              {mode === 'guest' ? (
                <>
                  <DropdownMenu.Item
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:bg-gray-50"
                    onSelect={() => {
                      /* About dialog — future story */
                    }}
                  >
                    About
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:bg-gray-50"
                    onSelect={() => navigate('/settings')}
                  >
                    Settings
                  </DropdownMenu.Item>
                </>
              ) : (
                <>
                  <DropdownMenu.Item
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:bg-gray-50"
                    onSelect={() => navigate('/settings')}
                  >
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="cursor-pointer px-3 py-2 text-sm text-red-600 outline-none hover:bg-gray-50 focus:bg-gray-50"
                    onSelect={() => {
                      /* Sign out — future story */
                    }}
                  >
                    Sign Out
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
