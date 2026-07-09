import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User } from 'lucide-react';
import React from 'react';

import { useSessionHandlers } from '../hooks/useSessionHandlers';

import { SyncStatusBell } from './SyncStatusBell';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Header(): React.ReactElement {
  const { mode, userIdSnippet, profile, syncStatus, handleSignOut, handleSwitchAccount } =
    useSessionHandlers();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-5">
      <span className="text-[15px] font-bold text-neutral-900">Site Analyser</span>

      {mode === 'guest' && (
        <>
          <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            LOCAL SESSION
          </span>
          {userIdSnippet && (
            <span className="font-mono text-[11px] text-neutral-400">{userIdSnippet}</span>
          )}
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        <SyncStatusBell mode={mode} syncStatus={syncStatus} />

        {mode === 'authenticated' && profile ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label={profile.name}
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 focus:outline-none"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    role="img"
                    aria-label={profile.name}
                    className="text-[13px] font-semibold text-neutral-700"
                  >
                    {getInitials(profile.name)}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] rounded-md border border-neutral-200 bg-white shadow-md"
                align="end"
                sideOffset={6}
              >
                <div className="border-b border-neutral-100 px-4 py-3">
                  <div className="text-sm font-semibold text-neutral-900">{profile.name}</div>
                  <div className="text-xs text-neutral-500">{profile.email}</div>
                  <div className="text-xs text-neutral-400">{profile.org}</div>
                </div>
                <DropdownMenu.Item
                  className="cursor-pointer px-4 py-2 text-sm text-neutral-700 outline-none hover:bg-neutral-50"
                  onSelect={() => {
                    handleSignOut();
                  }}
                >
                  Sign Out
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="cursor-pointer px-4 py-2 text-sm text-neutral-700 outline-none hover:bg-neutral-50"
                  onSelect={() => {
                    handleSwitchAccount();
                  }}
                >
                  Switch Account
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <button
            type="button"
            aria-label="User menu"
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
          >
            <User size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
