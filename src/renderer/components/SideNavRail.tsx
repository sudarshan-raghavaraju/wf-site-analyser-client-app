import { Folder, HelpCircle, LayoutDashboard, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { ROUTES } from '../routes';

function AppLogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path
        d="M8 22L12 16L16 19L20 12L24 18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="18" r="1.5" fill="white" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, end: true, Icon: LayoutDashboard },
  { label: 'Projects', to: ROUTES.PROJECTS, end: false, Icon: Folder },
  { label: 'Settings', to: ROUTES.SETTINGS_ROOT, end: false, Icon: Settings },
  { label: 'Help', to: ROUTES.HELP, end: false, Icon: HelpCircle },
] as const;

export function SideNavRail(): React.ReactElement {
  const [version, setVersion] = useState<string>('');
  const navItemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    window.api?.getAppVersion?.().then((v) => {
      if (!cancelled) setVersion(`V${v}`);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLinkKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
    const links = Array.from(navItemsRef.current?.querySelectorAll('a') ?? []) as HTMLElement[];
    const index = links.indexOf(e.currentTarget);
    if (e.key === 'ArrowDown' && index >= 0 && index < links.length - 1) {
      links[index + 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && index > 0) {
      links[index - 1]?.focus();
      e.preventDefault();
    }
  }, []);

  return (
    <nav
      className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <AppLogoIcon />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-gray-900">Site Analyser</span>
          {version && <span className="text-xs text-gray-400">{version}</span>}
        </div>
      </div>

      <div ref={navItemsRef} className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ label, to, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onKeyDown={handleLinkKeyDown}
            className={({ isActive }) =>
              [
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'hover:bg-gray-100',
                isActive
                  ? 'border-l-2 border-blue-600 bg-blue-50 pl-[10px] text-blue-600'
                  : 'text-gray-600',
              ].join(' ')
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
