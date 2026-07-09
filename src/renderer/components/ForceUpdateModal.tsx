import * as Dialog from '@radix-ui/react-dialog';
import { type ReactElement } from 'react';

import { Button } from './Button';
import { ReleaseNotes, type ReleaseNoteItem } from './ReleaseNotes';

export type ForceUpdateStatus = 'ready' | 'downloading' | 'installing' | 'error' | 'restarting';

export interface ForceUpdateModalProps {
  currentVersion: string;
  newVersion: string;
  status: ForceUpdateStatus;
  downloadProgress?: number;
  /** Approximate install duration in seconds, surfaced in the footer. Defaults to 45. */
  estimatedSeconds?: number;
  /**
   * Release notes shown between the version pane and the footer.
   * When empty, the section is hidden.
   */
  releaseNotes?: ReleaseNoteItem[];
  onInstall: () => void;
  onRetry?: () => void;
}

interface StatusStyle {
  dot: string;
  text: string;
  label: string;
}

const STATUS_STYLES: Record<ForceUpdateStatus, StatusStyle> = {
  ready: { dot: 'bg-primary-dark', text: 'text-primary-dark', label: 'Ready to Install' },
  downloading: { dot: 'bg-primary-dark', text: 'text-primary-dark', label: 'Downloading...' },
  installing: { dot: 'bg-primary-dark', text: 'text-primary-dark', label: 'Installing...' },
  error: { dot: 'bg-error', text: 'text-error', label: 'Failed' },
  restarting: { dot: 'bg-primary-dark', text: 'text-primary-dark', label: 'Restarting...' },
};

export function ForceUpdateModal({
  currentVersion,
  newVersion,
  status,
  downloadProgress,
  estimatedSeconds = 45,
  releaseNotes = [],
  onInstall,
  onRetry,
}: ForceUpdateModalProps): ReactElement {
  const isError = status === 'error';
  const isInstalling = status === 'installing';
  const isDownloading = status === 'downloading';
  const ctaDisabled = isDownloading || isInstalling || status === 'restarting';
  const statusStyle = STATUS_STYLES[status];

  const statusLabel =
    isDownloading && downloadProgress !== undefined
      ? `Downloading... ${downloadProgress}%`
      : statusStyle.label;

  return (
    <Dialog.Root open modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm" />
        <Dialog.Content
          aria-modal="true"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-[512px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-modal bg-white shadow-lg focus:outline-none"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 bg-white px-8 pb-6 pt-8">
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary-dark/10 px-2 py-1 text-xxs font-normal uppercase tracking-widest text-primary-dark">
                System Update
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-tight text-neutral-800">Status:</span>
                <span className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2 w-2 rounded-full ${statusStyle.dot}`}
                  />
                  <span className={`text-xs ${statusStyle.text}`}>{statusLabel}</span>
                </span>
              </div>
            </div>

            <Dialog.Title className="text-display font-normal tracking-tighter text-neutral-900">
              Update Required
            </Dialog.Title>

            <Dialog.Description className="text-base text-neutral-800">
              A critical update is mandatory to continue using the Site Analyzer environment.
            </Dialog.Description>
          </div>

          {/* Version Comparison Pane */}
          <div className="flex items-center justify-between bg-neutral-100 px-8 py-6">
            <div className="flex flex-col items-start">
              <p className="text-xxs uppercase tracking-widest text-neutral-800/60">
                Current Version
              </p>
              <p className="font-mono text-xl font-bold text-neutral-900">{currentVersion}</p>
            </div>
            <span role="img" aria-label="arrow" className="px-4 text-xl text-primary">
              →
            </span>
            <div className="flex flex-col items-end">
              <p className="text-xxs uppercase tracking-widest text-primary">New Version</p>
              <p className="font-mono text-xl font-bold text-primary-dark">{newVersion}</p>
            </div>
          </div>

          {/* Release Notes */}
          {releaseNotes.length > 0 && (
            <div className="bg-white px-8 py-8">
              <ReleaseNotes notes={releaseNotes} />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between bg-neutral-100 px-8 py-6">
            <p className="max-w-[180px] text-xxs text-neutral-800">
              Approximate update time:{' '}
              <span className="text-neutral-900">{estimatedSeconds} seconds</span>. Your work will
              be saved.
            </p>

            {isError ? (
              <Button onClick={onRetry} variant="primary" disabled={!onRetry}>
                Retry
              </Button>
            ) : (
              <Button
                variant="primary-gradient"
                onClick={onInstall}
                loading={isInstalling}
                disabled={ctaDisabled}
                aria-busy={isInstalling}
              >
                Restart and Update Now
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
