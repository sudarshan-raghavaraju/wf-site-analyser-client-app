import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { lt as semverLt, valid as semverValid } from 'semver';

import type { ReleaseNote } from '@shared/types';

import { ForceUpdateModal, type ForceUpdateStatus } from './ForceUpdateModal';

type CheckState =
  | { kind: 'idle' }
  | { kind: 'upToDate' }
  | { kind: 'optional'; newVersion: string }
  | {
      kind: 'mandatory';
      newVersion: string;
      releaseNotes: ReleaseNote[];
      estimatedSeconds?: number;
    }
  | { kind: 'failed' };

const BASE_POLL_INTERVAL_MS = 30 * 60 * 1000;
const MAX_POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;
const BACKOFF_JITTER_RATIO = 0.2;

function backoffDelay(failures: number): number {
  if (failures <= 0) return BASE_POLL_INTERVAL_MS;
  const exponential = BASE_POLL_INTERVAL_MS * 2 ** failures;
  const capped = Math.min(exponential, MAX_POLL_INTERVAL_MS);
  const jitter = capped * BACKOFF_JITTER_RATIO * (Math.random() * 2 - 1);
  return Math.max(1000, Math.round(capped + jitter));
}

// Returns false on invalid input so a bad server response can't force the modal.
function isBelowMinimumVersion(current: string, minimum: string): boolean {
  if (!semverValid(current) || !semverValid(minimum)) return false;
  return semverLt(current, minimum);
}

const KNOWN_STATUSES: readonly ForceUpdateStatus[] = [
  'ready',
  'downloading',
  'installing',
  'error',
  'restarting',
];

function normalizeStatus(raw: string): ForceUpdateStatus | null {
  const s = raw.trim().toLowerCase();
  if ((KNOWN_STATUSES as readonly string[]).includes(s)) {
    return s as ForceUpdateStatus;
  }
  if (s === 'download-progress' || s === 'downloading-update') return 'downloading';
  if (s === 'update-downloaded') return 'ready';
  return null;
}

// Suppress "Checking…" if the check finishes quickly — prevents a UI flash.
const CHECKING_REVEAL_DELAY_MS = 200;

export function VersionChecker(): ReactElement | null {
  const [checkState, setCheckState] = useState<CheckState>({ kind: 'idle' });
  const [currentVersion, setCurrentVersion] = useState('');
  const [installStatus, setInstallStatus] = useState<ForceUpdateStatus>('ready');
  const [downloadProgress, setDownloadProgress] = useState<number | undefined>(undefined);
  const [showCheckingIndicator, setShowCheckingIndicator] = useState(false);

  // Once mandatory is set, lock it — later polls must never unmount the modal mid-install.
  const mandatoryLockedRef = useRef(false);

  useEffect(() => {
    const { api } = window as Window & { api?: typeof window.api };
    if (!api) {
      setCheckState({ kind: 'failed' });
      return undefined;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const localVersionPromise = window.api
      .getAppVersion()
      .then((v) => v)
      .catch((err: unknown) => {
        console.error('[VersionChecker] getAppVersion failed:', err);
        return '';
      });

    localVersionPromise.then((v) => {
      if (!cancelled && v) setCurrentVersion((prev) => prev || v);
    });

    const scheduleNext = (delayMs: number) => {
      if (cancelled || mandatoryLockedRef.current) return;
      // eslint-disable-next-line no-use-before-define
      timeoutId = setTimeout(runCheck, delayMs);
    };

    const runCheck = () => {
      Promise.all([api.checkForUpdates(), localVersionPromise])
        .then(([result, localVersion]) => {
          if (cancelled || mandatoryLockedRef.current) return;
          failures = 0;

          let lockedThisRun = false;

          if (!result.updateAvailable) {
            setCheckState({ kind: 'upToDate' });
          } else {
            const newVersion = result.latestVersion ?? result.version;
            if (!newVersion) {
              console.error(
                'Version check returned updateAvailable=true but no latestVersion/version field',
              );
              setCheckState({ kind: 'failed' });
            } else {
              const serverCurrentVersion = result.currentVersion ?? localVersion;
              if (serverCurrentVersion) setCurrentVersion(serverCurrentVersion);

              const isBelowMinimum =
                result.minimumVersion && serverCurrentVersion
                  ? isBelowMinimumVersion(serverCurrentVersion, result.minimumVersion)
                  : false;

              if (result.mandatory || isBelowMinimum) {
                mandatoryLockedRef.current = true;
                lockedThisRun = true;
                setCheckState({
                  kind: 'mandatory',
                  newVersion,
                  releaseNotes: result.releaseNotes ?? [],
                  estimatedSeconds: result.estimatedUpdateSeconds,
                });
              } else {
                setCheckState({ kind: 'optional', newVersion });
              }
            }
          }

          if (!lockedThisRun) scheduleNext(BASE_POLL_INTERVAL_MS);
        })
        .catch((err: unknown) => {
          if (cancelled || mandatoryLockedRef.current) return;
          failures += 1;
          console.error(`Version check failed (attempt ${failures}):`, err);
          setCheckState({ kind: 'failed' });
          scheduleNext(backoffDelay(failures));
        });
    };

    runCheck();

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setShowCheckingIndicator(true), CHECKING_REVEAL_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const { api } = window as Window & { api?: typeof window.api };
    if (!api) return undefined;
    const unsubStatus = api.onUpdateStatus?.((raw) => {
      const next = normalizeStatus(raw);
      if (next) setInstallStatus(next);
    });
    const unsubProgress = api.onUpdateProgress?.((percent) => {
      setDownloadProgress(Math.max(0, Math.min(100, Math.round(percent))));
    });
    return () => {
      unsubStatus?.();
      unsubProgress?.();
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const { api } = window as Window & { api?: typeof window.api };
    if (!api) return;
    // Optimistically flip to 'downloading' so the button disables immediately;
    // main process drives later transitions via onUpdateStatus.
    setInstallStatus('downloading');
    try {
      await api['analysis:saveAutoSave']();
    } catch {
      // Auto-save is best-effort — never block the update on it.
    }
    try {
      await api.installUpdate();
    } catch (err) {
      console.error('Install update failed:', err);
      setInstallStatus('error');
    }
  }, []);

  const handleRetry = useCallback(() => {
    handleInstall().catch((err: unknown) => {
      console.error('[VersionChecker] unexpected error in handleRetry:', err);
      setInstallStatus('error');
    });
  }, [handleInstall]);

  if (checkState.kind === 'mandatory') {
    return (
      <ForceUpdateModal
        currentVersion={currentVersion}
        newVersion={checkState.newVersion}
        status={installStatus}
        downloadProgress={downloadProgress}
        releaseNotes={checkState.releaseNotes}
        estimatedSeconds={checkState.estimatedSeconds}
        onInstall={handleInstall}
        onRetry={handleRetry}
      />
    );
  }

  if (checkState.kind === 'optional') {
    return (
      <aside
        role="status"
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary-dark shadow-sm"
      >
        <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-primary" />
        Update available — version {checkState.newVersion}
      </aside>
    );
  }
  if (checkState.kind === 'failed') {
    return (
      <aside
        role="alert"
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-md border border-warning/40 bg-warning-surface px-3 py-2 text-sm text-warning-dark shadow-sm"
      >
        <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-warning" />
        Unable to check for updates. Proceeding without verification.
      </aside>
    );
  }

  if (checkState.kind === 'idle' && showCheckingIndicator) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm"
      >
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-neutral-400"
        />
        Checking for updates…
      </aside>
    );
  }

  return null;
}
