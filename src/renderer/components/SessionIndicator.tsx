import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User } from 'lucide-react';
import React from 'react';

import { useSessionHandlers } from '../hooks/useSessionHandlers';

import { SyncStatusBell } from './SyncStatusBell';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SessionIndicator(): React.ReactElement {
  const { mode, userIdSnippet, profile, syncStatus, handleSignOut, handleSwitchAccount } =
    useSessionHandlers();

  return (
    <div className="flex items-center gap-3">
      {mode === 'guest' && (
        <>
          <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            LOCAL SESSION
          </span>
          {userIdSnippet && (
            <span className="font-mono text-[11px] text-gray-400">{userIdSnippet}</span>
          )}
        </>
      )}

      <SyncStatusBell mode={mode} syncStatus={syncStatus} />

      {mode === 'guest' && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="User menu"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 focus:outline-none"
            >
              <User size={18} aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[160px] rounded-md border border-gray-200 bg-white shadow-md"
              align="end"
              sideOffset={6}
            >
              <DropdownMenu.Item className="cursor-pointer px-4 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50">
                About
              </DropdownMenu.Item>
              <DropdownMenu.Item className="cursor-pointer px-4 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50">
                Settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      {mode === 'authenticated' && profile && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={profile.name}
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 focus:outline-none"
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
                  className="text-[13px] font-semibold text-gray-700"
                >
                  {getInitials(profile.name)}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] rounded-md border border-gray-200 bg-white shadow-md"
              align="end"
              sideOffset={6}
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="text-sm font-semibold text-gray-900">{profile.name}</div>
                <div className="text-xs text-gray-500">{profile.email}</div>
                <div className="text-xs text-gray-400">{profile.org}</div>
              </div>
              <DropdownMenu.Item
                className="cursor-pointer px-4 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
                onSelect={() => {
                  handleSignOut();
                }}
              >
                Sign Out
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer px-4 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
                onSelect={() => {
                  handleSwitchAccount();
                }}
              >
                Switch Account
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
