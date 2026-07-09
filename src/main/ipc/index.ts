import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, promises as fs, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';

import { ipcMain, app, shell, type IpcMainInvokeEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import { z } from 'zod';

import {
  IPC_CHANNELS,
  type AppEnv,
  type AutoSavePayload,
  type AutoSaveResult,
  type PingResult,
  type UpdateCheckResult,
} from '../../shared/types';

const DEFAULT_UPDATE_CHECK_ENDPOINT = 'https://updates.example.com/api/v1/updates/check';
const envUrl = process.env.UPDATE_SERVER_URL;
// Reject non-https override to keep the update channel TLS-only.
const UPDATE_CHECK_ENDPOINT =
  envUrl && envUrl.startsWith('https://') ? envUrl : DEFAULT_UPDATE_CHECK_ENDPOINT;

// ---------------------------------------------------------------------------
// Runtime schemas — every JSON crossing a trust boundary (network or disk)
// is validated with safeParse before being cast to its TS type.
// ---------------------------------------------------------------------------
const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), { message: 'must use https://' });
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/i);

const releaseNoteSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['feature', 'security', 'ui', 'bugfix']),
  icon: z.string().optional(),
});

const updateCheckResultSchema: z.ZodType<UpdateCheckResult> = z.object({
  updateAvailable: z.boolean(),
  mandatory: z.boolean().optional(),
  latestVersion: z.string().optional(),
  minimumVersion: z.string().optional(),
  currentVersion: z.string().optional(),
  downloadUrl: httpsUrl.optional(),
  sha256: sha256Hex.optional(),
  estimatedUpdateSeconds: z.number().optional(),
  publishedAt: z.string().optional(),
  releaseNotes: z.array(releaseNoteSchema).optional(),
  version: z.string().optional(),
});

const cachedUpdateManifestSchema = z.object({
  result: updateCheckResultSchema,
  cachedAt: z.string(),
});

// Strict input schema — only known fields from the renderer survive the trip
// to disk. schemaVersion + savedAt are always set by the main process below.
const autoSavePayloadInputSchema = z
  .object({
    analysisId: z.string().optional(),
    state: z.unknown().optional(),
  })
  .strict();

const autoSavePayloadOnDiskSchema: z.ZodType<AutoSavePayload> = z.object({
  schemaVersion: z.literal(1),
  savedAt: z.string(),
  analysisId: z.string().optional(),
  state: z.unknown().optional(),
});

const UPDATE_MANIFEST_CACHE_FILE = 'update-manifest.json';
const UPDATE_MANIFEST_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function updateManifestCachePath(): string {
  return path.join(app.getPath('userData'), UPDATE_MANIFEST_CACHE_FILE);
}

async function readCachedUpdateManifest(): Promise<UpdateCheckResult | null> {
  try {
    const raw = await fs.readFile(updateManifestCachePath(), 'utf8');
    const parsed = cachedUpdateManifestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const age = Date.now() - new Date(parsed.data.cachedAt).getTime();
    if (Number.isNaN(age) || age > UPDATE_MANIFEST_CACHE_MAX_AGE_MS) {
      console.log('[update-check] cached manifest stale, ignoring');
      return null;
    }
    return parsed.data.result;
  } catch {
    // ENOENT (no cache yet) or malformed JSON (corrupt cache) → no fallback.
    return null;
  }
}

async function writeCachedUpdateManifest(result: UpdateCheckResult): Promise<void> {
  const body = { result, cachedAt: new Date().toISOString() };
  const filePath = updateManifestCachePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
}

let installInFlight = false;

// ---------------------------------------------------------------------------
// Local key/value store — a small JSON file in userData. Backs the anonymous
// session id, the renderer store:* channels, and storage-usage reporting.
// ---------------------------------------------------------------------------
function getStorePath(): string {
  return path.join(app.getPath('userData'), 'app-store.json');
}

function readStore(): Record<string, unknown> {
  const p = getStorePath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, unknown>): void {
  writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf8');
}

export function registerIpcHandlers(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  ipcMain.handle(
    IPC_CHANNELS.PING,
    (): PingResult => ({
      pong: true,
      timestamp: Date.now(),
    }),
  );

  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async (): Promise<UpdateCheckResult> => {
    // Build the URL via WHATWG URL + searchParams (no string-concat injection risk).
    const url = new URL(UPDATE_CHECK_ENDPOINT);
    url.searchParams.set('version', app.getVersion());
    url.searchParams.set('platform', process.platform);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        throw new Error(`Update check failed: HTTP ${res.status}`);
      }
      const parsed = updateCheckResultSchema.safeParse(await res.json());
      if (!parsed.success) {
        throw new Error('Update check returned an invalid payload');
      }
      const result = parsed.data;
      // Best-effort cache write; never fail the call on cache write failure.
      writeCachedUpdateManifest(result).catch((err) =>
        console.warn('[update-check] cache write failed:', err),
      );
      return result;
    } catch (err) {
      const cached = await readCachedUpdateManifest();
      if (cached) {
        console.log('[update-check] network failed, serving cached manifest');
        return cached;
      }
      throw err;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INSTALL_UPDATE, async (event: IpcMainInvokeEvent): Promise<void> => {
    const send = (channel: string, ...args: unknown[]): void => {
      if (!event.sender.isDestroyed()) {
        event.sender.send(channel, ...args);
      }
    };

    if (installInFlight) {
      send(IPC_CHANNELS.UPDATE_STATUS, 'downloading');
      return;
    }
    installInFlight = true;

    // Unpackaged builds (dev) have no update feed and electron-updater throws
    // on checkForUpdates(). Fall back to the demo lifecycle so the modal flow
    // is still exercisable locally.
    if (!app.isPackaged) {
      console.log('[install] dev fallback — simulating lifecycle');
      send(IPC_CHANNELS.UPDATE_STATUS, 'downloading');
      for (let pct = 25; pct <= 100; pct += 25) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((r) => {
          setTimeout(r, 500);
        });
        send(IPC_CHANNELS.UPDATE_PROGRESS, pct);
      }
      send(IPC_CHANNELS.UPDATE_STATUS, 'installing');
      await new Promise<void>((r) => {
        setTimeout(r, 1500);
      });
      send(IPC_CHANNELS.UPDATE_STATUS, 'restarting');
      installInFlight = false;
      return;
    }

    const cached = await readCachedUpdateManifest();
    if (!cached?.downloadUrl) {
      installInFlight = false;
      send(IPC_CHANNELS.UPDATE_STATUS, 'error');
      return;
    }

    try {
      send(IPC_CHANNELS.UPDATE_STATUS, 'downloading');
      if (!cached.sha256) {
        throw new Error('Update manifest missing installer checksum');
      }

      const res = await fetch(cached.downloadUrl, { signal: AbortSignal.timeout(10 * 60 * 1000) });
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      if (!res.body) throw new Error('Download response has no body');

      const total = Number.parseInt(res.headers.get('content-length') ?? '0', 10);
      const rawName = new URL(cached.downloadUrl).pathname.split('/').pop() ?? 'update';
      const ALLOWED_EXTS = new Set(['.exe', '.msi', '.dmg', '.deb', '.rpm', '.AppImage']);
      const ext = path.extname(rawName).toLowerCase();
      if (!ALLOWED_EXTS.has(ext)) {
        throw new Error(`Rejected installer with unexpected extension: ${ext || '(none)'}`);
      }
      const filename = `update${ext}`;
      const tempPath = path.join(app.getPath('temp'), filename);

      const fileHandle = await fs.open(tempPath, 'w');
      try {
        let received = 0;
        const reader = res.body.getReader();
        let chunk = await reader.read();
        while (!chunk.done) {
          // eslint-disable-next-line no-await-in-loop
          await fileHandle.write(chunk.value);
          received += chunk.value.length;
          if (total > 0) send(IPC_CHANNELS.UPDATE_PROGRESS, Math.round((received / total) * 100));
          // eslint-disable-next-line no-await-in-loop
          chunk = await reader.read();
        }
      } finally {
        await fileHandle.close();
      }

      const fileBytes = await fs.readFile(tempPath);
      const actualSha256 = createHash('sha256').update(fileBytes).digest('hex');
      if (actualSha256.toLowerCase() !== cached.sha256.toLowerCase()) {
        throw new Error('Installer integrity check failed');
      }

      send(IPC_CHANNELS.UPDATE_STATUS, 'installing');
      // Brief delay so the renderer can paint 'installing' before the app quits.
      await new Promise<void>((r) => {
        setTimeout(r, 500);
      });
      send(IPC_CHANNELS.UPDATE_STATUS, 'restarting');
      installInFlight = false;

      if (process.platform === 'win32') {
        spawn(tempPath, ['/S'], { detached: true, stdio: 'ignore' }).unref();
      } else {
        await shell.openPath(tempPath);
      }
      app.quit();
    } catch (err) {
      installInFlight = false;
      console.error('[install] download failed:', err);
      send(IPC_CHANNELS.UPDATE_STATUS, 'error');
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.ANALYSIS_SAVE_AUTO,
    async (_event, payload?: unknown): Promise<AutoSaveResult> => {
      // Strict-parse the renderer-supplied payload so only known fields hit disk.
      const safe = payload ? autoSavePayloadInputSchema.safeParse(payload) : null;
      const safeData = safe?.success ? safe.data : {};
      const savedAt = new Date().toISOString();
      const filePath = path.join(app.getPath('userData'), 'autosave.json');
      const body: AutoSavePayload = { schemaVersion: 1, savedAt, ...safeData };
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
      return { path: filePath, savedAt };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.ANALYSIS_LOAD_AUTO_SAVE,
    async (): Promise<AutoSavePayload | null> => {
      const filePath = path.join(app.getPath('userData'), 'autosave.json');
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = autoSavePayloadOnDiskSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        // ENOENT (no autosave yet) or malformed JSON (corrupt file) → start fresh.
        return null;
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GET_ENV,
    (): AppEnv => ({
      NODE_ENV: process.env.NODE_ENV ?? 'production',
      APP_STAGE: process.env.APP_STAGE ?? 'production',
      API_BASE_URL: process.env.API_BASE_URL ?? '',
      UPDATE_SERVER_URL: UPDATE_CHECK_ENDPOINT,
    }),
  );

  ipcMain.handle(IPC_CHANNELS.GET_SESSION_ID, () => readStore().sessionId ?? null);

  ipcMain.handle(IPC_CHANNELS.STORE_SET, (_event, key: string, value: unknown) => {
    const data = readStore();
    data[key] = value;
    writeStore(data);
  });

  ipcMain.handle(IPC_CHANNELS.STORE_GET, (_event, key: string) => readStore()[key] ?? null);

  ipcMain.handle(IPC_CHANNELS.STORE_DELETE, (_event, key: string) => {
    const data = readStore();
    delete data[key];
    writeStore(data);
  });

  ipcMain.handle(IPC_CHANNELS.DATA_GET_STORAGE, () => {
    const storePath = getStorePath();
    const usedBytes = existsSync(storePath) ? statSync(storePath).size : 0;
    const totalBytes = 10 * 1024 * 1024 * 1024; // 10 GB soft cap
    return { usedBytes, totalBytes };
  });

  ipcMain.handle(IPC_CHANNELS.DATA_CLEAR_OLD, () => {
    writeStore({});
  });
}
