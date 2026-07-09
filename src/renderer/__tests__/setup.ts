import '@testing-library/jest-dom';
import { vi, afterAll, afterEach, beforeAll } from 'vitest';

import { mockServer } from '@main/mocks/server';

// ---------------------------------------------------------------------------
// Mock the Electron contextBridge API (window.api)
// ---------------------------------------------------------------------------
const mockElectronAPI = {
  // App lifecycle
  getAppVersion: vi.fn().mockResolvedValue('2.4.0'),
  checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: false }),
  installUpdate: vi.fn().mockResolvedValue(undefined),
  onUpdateStatus: vi.fn().mockReturnValue(() => {}),
  onUpdateProgress: vi.fn().mockReturnValue(() => {}),

  // Session / storage
  getSessionId: vi.fn().mockResolvedValue('test-uuid-1234'),
  storeSet: vi.fn().mockResolvedValue(undefined),
  storeGet: vi.fn().mockResolvedValue(null),
  storeDelete: vi.fn().mockResolvedValue(undefined),

  // Secure storage (safeStorage)
  'safeStorage:encrypt': vi.fn().mockResolvedValue(undefined),
  'safeStorage:decrypt': vi.fn().mockResolvedValue('decrypted-value'),
  'safeStorage:delete': vi.fn().mockResolvedValue(undefined),

  // IMS Authentication
  'auth:openOAuthWindow': vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token', userId: 'user-123' }),
  'auth:signOut': vi.fn().mockResolvedValue(undefined),
  'auth:switchAccount': vi.fn().mockResolvedValue(undefined),
  'auth:getTokenClaims': vi
    .fn()
    .mockResolvedValue({ name: 'Test User', email: 'test@example.com', org: 'Test Org' }),

  // Analysis
  'analysis:start': vi.fn().mockResolvedValue({ analysisId: 'analysis-123' }),
  'analysis:cancel': vi.fn().mockResolvedValue(undefined),
  'analysis:pause': vi.fn().mockResolvedValue(undefined),
  'analysis:resume': vi.fn().mockResolvedValue(undefined),
  'analysis:getStatus': vi.fn().mockResolvedValue({ status: 'running', progress: 68 }),
  'analysis:saveAutoSave': vi.fn().mockResolvedValue({
    path: '/mock/userData/autosave.json',
    savedAt: '2026-06-01T00:00:00.000Z',
  }),
  'analysis:loadAutoSave': vi.fn().mockResolvedValue(null),

  // Data / migration
  'data:migrateGuestToAuth': vi.fn().mockResolvedValue({ success: true }),
  'data:discardGuestData': vi.fn().mockResolvedValue(undefined),
  'data:getStorageUsage': vi
    .fn()
    .mockResolvedValue({ usedBytes: 2468987289, totalBytes: 10737418240 }),
  'data:clearOldData': vi.fn().mockResolvedValue(undefined),

  // File system
  'fs:openDialog': vi.fn().mockResolvedValue({ filePath: '/tmp/test.csv', content: '' }),
  'fs:exportFile': vi.fn().mockResolvedValue(undefined),

  // Shell
  'shell:openExternal': vi.fn().mockResolvedValue(undefined),

  // RAG
  'rag:buildKnowledgeBase': vi.fn().mockResolvedValue({ ready: true }),
  'rag:query': vi.fn().mockResolvedValue({ answer: 'Mock answer', sources: [] }),
};

Object.defineProperty(window, 'api', {
  value: mockElectronAPI,
  writable: true,
});

// ---------------------------------------------------------------------------
// Mock React Router (used in integration-style tests)
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// ---------------------------------------------------------------------------
// MSW — intercepts fetch() calls from the main-process IPC handlers in tests
// that swap window.api.checkForUpdates for a real fetch implementation.
// Tests that keep the vi.fn() mock are unaffected.
// ---------------------------------------------------------------------------
beforeAll(() => mockServer.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});
