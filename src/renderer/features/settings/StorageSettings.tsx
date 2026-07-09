import * as Dialog from '@radix-ui/react-dialog';
import React, { useEffect, useState } from 'react';

interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    const gb = bytes / 1_073_741_824;
    return `${parseFloat(gb.toFixed(1))} GB`;
  }
  const mb = Math.round(bytes / 1_048_576);
  return `${mb.toLocaleString()} MB`;
}

export function StorageSettings(): React.ReactElement {
  const [retention, setRetention] = useState('30');
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void (window.api['data:getStorageUsage']() as Promise<StorageUsage>).then(setUsage);
  }, []);

  function handleClearConfirmed(): void {
    window.api['data:clearOldData']()
      .then(() => {
        setConfirmOpen(false);
      })
      .catch(() => {});
  }

  const usagePct = usage ? (usage.usedBytes / usage.totalBytes) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Storage</h2>

      <div
        data-testid="warning-banner"
        className="flex items-start gap-3 rounded-r-md border-l-4 border-amber-500 bg-amber-50 p-4"
      >
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="text-sm text-amber-800">
          <strong className="font-semibold">Retention policy:</strong>
          {
            ' Data older than your selected period will be automatically cleared. This limit may change as the app evolves.'
          }
        </p>
      </div>

      <div className="space-y-1.5">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="retention-select" className="block text-sm font-medium text-gray-700">
          Data Persistence
        </label>
        <select
          id="retention-select"
          aria-label="Data Persistence retention period"
          value={retention}
          onChange={(e) => setRetention(e.target.value)}
          className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">7 Days</option>
          <option value="14">14 Days</option>
          <option value="30">30 Days (Standard Retention)</option>
          <option value="90">90 Days</option>
          <option value="unlimited">Unlimited</option>
        </select>
      </div>

      {usage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span className="font-medium">Storage Usage</span>
            <span>
              <strong>{formatBytes(usage.usedBytes)}</strong>
              {` of ${formatBytes(usage.totalBytes)}`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={[
                'h-full rounded-full transition-all',
                usagePct >= 80 ? 'bg-red-500' : 'bg-blue-500',
              ].join(' ')}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{`${usagePct.toFixed(0)}% used`}</p>
        </div>
      )}

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Clear Data
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Clear all local data?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              This action cannot be undone. All locally stored projects, analysis results, and chat
              history will be permanently deleted.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => {
                  handleClearConfirmed();
                }}
              >
                Yes, delete all data
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
