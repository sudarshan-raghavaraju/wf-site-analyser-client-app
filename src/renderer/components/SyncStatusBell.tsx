import { Bell, RefreshCw } from 'lucide-react';
import React from 'react';

const SYNC_STYLES: Record<string, string> = {
  synced: 'text-green-600',
  syncing: 'text-blue-600',
  offline: 'text-gray-500',
  error: 'text-red-600',
};

interface Props {
  mode: 'guest' | 'authenticated';
  syncStatus: string | null;
}

export function SyncStatusBell({ mode, syncStatus }: Props): React.ReactElement {
  return (
    <>
      {mode === 'authenticated' && syncStatus && (
        <span
          className={[
            'flex items-center gap-1 text-[11px] font-medium',
            SYNC_STYLES[syncStatus] ?? 'text-gray-500',
          ].join(' ')}
        >
          {syncStatus === 'syncing' && <RefreshCw size={12} aria-hidden="true" />}
          {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
        </span>
      )}
      <button
        type="button"
        aria-label="Notifications bell"
        className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
      >
        <Bell size={18} aria-hidden="true" />
      </button>
    </>
  );
}
