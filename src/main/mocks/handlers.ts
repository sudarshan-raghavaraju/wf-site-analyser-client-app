import { http, HttpResponse } from 'msw';

import type { UpdateCheckResult } from '../../shared/types';

/**
 * Mock response for `GET /api/v1/updates/check`.
 * Used by MSW in development so the renderer can demonstrate the full
 * version-check → force-update modal lifecycle without a real update server.
 */
const SAMPLE_UPDATE_RESPONSE: UpdateCheckResult = {
  latestVersion: '3.0.0',
  minimumVersion: '0.1.0',
  mandatory: true,
  updateAvailable: true,
  currentVersion: '0.1.0',
  downloadUrl:
    'https://updates.example.com/site-analyser/2.4.0/Site-Analyser-2.4.0-darwin-universal.zip',
  estimatedUpdateSeconds: 45,
  publishedAt: '2026-05-15T10:00:00Z',
  releaseNotes: [
    {
      icon: 'gear',
      title: 'Enhanced RAG Engine',
      description:
        'Improved retrieval accuracy and faster indexing for large site crawls. See the [docs](https://docs.example.com/rag) for details.',
      category: 'feature',
    },
    {
      icon: 'shield',
      title: 'Security Patch 2026.05',
      description:
        'Addresses **CVE-2026-1234** in the auth token refresh flow. Update is required to continue using the app.',
      category: 'security',
    },
    {
      icon: 'sparkle',
      title: 'UI Precision Alignment',
      description:
        'Sidebar, header, and force-update modal now match Figma spacing and typography tokens.',
      category: 'ui',
    },
    {
      icon: 'wrench',
      title: 'Crash on empty CSV upload fixed',
      description:
        'Uploading a CSV with **no rows** no longer crashes the analysis. Empty files now show a clear error message.',
      category: 'bugfix',
    },
  ],
};

export const handlers = [
  http.get('https://updates.example.com/api/v1/updates/check', () =>
    HttpResponse.json(SAMPLE_UPDATE_RESPONSE),
  ),
];
