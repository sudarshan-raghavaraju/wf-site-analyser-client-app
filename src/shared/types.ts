/**
 * Shared types between main, preload, and renderer processes.
 */

// ---------------------------------------------------------------------------
// IPC Channel names
// ---------------------------------------------------------------------------
export const IPC_CHANNELS = {
  GET_APP_VERSION: 'app:getVersion',
  CHECK_FOR_UPDATES: 'app:checkForUpdates',
  INSTALL_UPDATE: 'app:installUpdate',
  GET_SESSION_ID: 'app:getSessionId',
  STORE_SET: 'store:set',
  STORE_GET: 'store:get',
  STORE_DELETE: 'store:delete',
  SAFE_STORAGE_ENCRYPT: 'safeStorage:encrypt',
  SAFE_STORAGE_DECRYPT: 'safeStorage:decrypt',
  SAFE_STORAGE_DELETE: 'safeStorage:delete',
  AUTH_OPEN_OAUTH: 'auth:openOAuthWindow',
  AUTH_SIGN_OUT: 'auth:signOut',
  AUTH_SWITCH_ACCOUNT: 'auth:switchAccount',
  AUTH_GET_TOKEN_CLAIMS: 'auth:getTokenClaims',
  ANALYSIS_START: 'analysis:start',
  ANALYSIS_CANCEL: 'analysis:cancel',
  ANALYSIS_PAUSE: 'analysis:pause',
  ANALYSIS_RESUME: 'analysis:resume',
  ANALYSIS_GET_STATUS: 'analysis:getStatus',
  ANALYSIS_SAVE_AUTO: 'analysis:saveAutoSave',
  ANALYSIS_LOAD_AUTO_SAVE: 'analysis:loadAutoSave',
  DATA_MIGRATE: 'data:migrateGuestToAuth',
  DATA_DISCARD_GUEST: 'data:discardGuestData',
  DATA_GET_STORAGE: 'data:getStorageUsage',
  DATA_CLEAR_OLD: 'data:clearOldData',
  FS_OPEN_DIALOG: 'fs:openDialog',
  FS_EXPORT_FILE: 'fs:exportFile',
  SHELL_OPEN_EXTERNAL: 'shell:openExternal',
  RAG_BUILD_KB: 'rag:buildKnowledgeBase',
  RAG_QUERY: 'rag:query',
  GET_ENV: 'app:getEnv',
  PING: 'app:ping',
  /** Main → renderer push: lifecycle status string
   * ('downloading' | 'installing' | 'restarting' | 'error' | 'ready'). */
  UPDATE_STATUS: 'update-status',
  /** Main → renderer push: download progress as an integer 0–100. */
  UPDATE_PROGRESS: 'update-progress',
} as const;

// ---------------------------------------------------------------------------
// IPC Response types
// ---------------------------------------------------------------------------
export type ReleaseNoteCategory = 'feature' | 'security' | 'ui' | 'bugfix';

export interface ReleaseNote {
  title: string;
  description: string;
  category: ReleaseNoteCategory;
  icon?: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  /** Whether the update is mandatory and must be installed before the app can be used. */
  mandatory?: boolean;
  /** Latest available version per the update server (e.g. "2.5.2"). */
  latestVersion?: string;
  /** Minimum supported version — below this, an update is mandatory. */
  minimumVersion?: string;
  /** Current running version as known by the server (echoed back from the request). */
  currentVersion?: string;
  /** Where the update artifact can be downloaded. */
  downloadUrl?: string;
  /** Expected SHA-256 hex digest for the downloaded update artifact. */
  sha256?: string;
  /** Approximate seconds the install/restart cycle will take, surfaced in the modal footer. */
  estimatedUpdateSeconds?: number;
  /** ISO-8601 publish timestamp of the release. */
  publishedAt?: string;
  /** Structured release notes; rendered inside the Force Update modal. */
  releaseNotes?: ReleaseNote[];
  /**
   * Legacy alias for `latestVersion`. Older test fixtures and mocks still use this; new
   * callers should prefer `latestVersion`. Kept optional so both shapes type-check.
   */
  version?: string;
}

export interface OAuthResult {
  accessToken: string;
  /** Optional refresh token; not all OAuth flows return one. */
  refreshToken?: string;
  /** User ID from the identity provider; may be absent in partial/loading mock states. */
  userId?: string;
}

export interface TokenClaims {
  name: string;
  email: string;
  org: string;
}

export interface AnalysisConfig {
  urls?: string[];
  csvPath?: string;
  figmaUrl?: string;
  maxPages?: number;
  [key: string]: unknown;
}

export interface AnalysisStartResult {
  analysisId: string;
}

/** A single page discovered and analysed during a run. */
export interface PageResult {
  url: string;
  template?: string;
  templateName?: string;
  blockCount?: number;
  screenshotUrl?: string;
}

export interface AnalysisStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  /** 0–100 completion percentage; absent in some partial status responses. */
  progress?: number;
  /** Pages discovered and analysed so far in this run. */
  pages?: PageResult[];
}
export interface CachedUpdateManifest {
  result: UpdateCheckResult;
  cachedAt: string;
}

export interface AutoSavePayload {
  schemaVersion: 1;
  /** ISO-8601 timestamp set by the main process when the file is written. */
  savedAt: string;
  /** Optional id when an analysis is in flight. Absent for plain "before-restart" snapshots. */
  analysisId?: string;
  /** Opaque renderer-owned state. The analysis-persistence story will give this a real shape. */
  state?: unknown;
}

/** Returned by `analysis:saveAutoSave` so the renderer can verify the write landed. */
export interface AutoSaveResult {
  path: string;
  savedAt: string;
}

export interface MigrationResult {
  success: boolean;
}

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
}

export interface FileDialogOptions {
  filters?: Array<{ name: string; extensions: string[] }>;
  title?: string;
}

export interface FileDialogResult {
  filePath: string;
  content: string;
}

export interface ExportPayload {
  filePath: string;
  data: unknown;
}

export interface RagBuildResult {
  ready: boolean;
}

export interface RagQueryResult {
  answer: string;
  sources: string[];
}

export interface PingResult {
  pong: true;
  timestamp: number;
}

export interface AppEnv {
  NODE_ENV: string;
  APP_STAGE: string;
  API_BASE_URL: string;
  /** Update-check endpoint (SA-202). Falls back to a dev default when unset. */
  UPDATE_SERVER_URL: string;
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Typed API exposed via contextBridge (window.api)
// ---------------------------------------------------------------------------
export interface ElectronAPI {
  // App lifecycle
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  installUpdate: () => Promise<void>;
  /**
   * Subscribe to update-status events from the main process.
   * Returns a cleanup function that removes the listener.
   */
  onUpdateStatus: (callback: (status: string) => void) => () => void;
  /**
   * Subscribe to download-progress events from the main process.
   * Callback receives a percent integer 0–100. Returns a cleanup function.
   */
  onUpdateProgress: (callback: (percent: number) => void) => () => void;
  getSessionId: () => Promise<string>;

  // Key-value store
  storeSet: (key: string, value: unknown) => Promise<void>;
  storeGet: (key: string) => Promise<unknown>;
  storeDelete: (key: string) => Promise<void>;

  // Secure storage (OS keychain via safeStorage)
  'safeStorage:encrypt': (key: string, value: string) => Promise<void>;
  'safeStorage:decrypt': (key: string) => Promise<string>;
  'safeStorage:delete': (key: string) => Promise<void>;

  // IMS Authentication
  'auth:openOAuthWindow': () => Promise<OAuthResult>;
  'auth:signOut': () => Promise<void>;
  'auth:switchAccount': () => Promise<void>;
  'auth:getTokenClaims': () => Promise<TokenClaims>;

  // Analysis
  'analysis:start': (config: AnalysisConfig) => Promise<AnalysisStartResult>;
  'analysis:cancel': (id: string) => Promise<void>;
  'analysis:pause': (id: string) => Promise<void>;
  'analysis:resume': (id: string) => Promise<void>;
  'analysis:getStatus': (id: string) => Promise<AnalysisStatus>;
  /**
   * Persist an autosave payload to disk. Called before a force-update restart and
   * by future analysis-feature autosave ticks. Payload is optional — when absent
   * the handler writes a minimal {schemaVersion, savedAt} marker.
   */
  'analysis:saveAutoSave': (payload?: AutoSavePayload) => Promise<AutoSaveResult>;
  /** Read the autosave file if present. Returns null when no autosave exists
   * or the file is unreadable. */
  'analysis:loadAutoSave': () => Promise<AutoSavePayload | null>;

  // Data / migration
  'data:migrateGuestToAuth': (userId: string) => Promise<MigrationResult>;
  'data:discardGuestData': () => Promise<void>;
  'data:getStorageUsage': () => Promise<StorageUsage>;
  'data:clearOldData': () => Promise<void>;

  // File system
  'fs:openDialog': (options?: FileDialogOptions) => Promise<FileDialogResult>;
  'fs:exportFile': (payload: ExportPayload) => Promise<void>;

  // Shell
  'shell:openExternal': (url: string) => Promise<void>;

  // RAG
  'rag:buildKnowledgeBase': (analysisId: string) => Promise<RagBuildResult>;
  'rag:query': (question: string) => Promise<RagQueryResult>;

  // Utilities
  getEnv: () => Promise<AppEnv>;
  ping: () => Promise<PingResult>;

  // Index signature — enables dynamic access (e.g. window.api[channelName])
  // without breaking the named-property types above.
  [key: string]: unknown;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
