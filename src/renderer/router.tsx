import React, { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import { AuthGuard } from './components/AuthGuard';
import { LayoutShell } from './components/LayoutShell';
import { NotFoundPage } from './pages/NotFoundPage';
import { ROUTES } from './routes';

const SignInPage = React.lazy(() =>
  import('./pages/SignInPage').then((m) => ({ default: m.SignInPage })),
);
const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AnalysisSetupPage = React.lazy(() =>
  import('./pages/AnalysisSetupPage').then((m) => ({ default: m.AnalysisSetupPage })),
);
const AnalysisProgressPage = React.lazy(() =>
  import('./pages/AnalysisProgressPage').then((m) => ({ default: m.AnalysisProgressPage })),
);
const ResultsWorkspacePage = React.lazy(() =>
  import('./pages/ResultsWorkspacePage').then((m) => ({ default: m.ResultsWorkspacePage })),
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const ForceUpdatePage = React.lazy(() =>
  import('./pages/ForceUpdatePage').then((m) => ({ default: m.ForceUpdatePage })),
);
const ProjectsPage = React.lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const HelpPage = React.lazy(() =>
  import('./pages/HelpPage').then((m) => ({ default: m.HelpPage })),
);

function ChunkFallback(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function withSuspense(Page: React.ComponentType): React.ReactElement {
  return (
    <Suspense fallback={<ChunkFallback />}>
      <Page />
    </Suspense>
  );
}

// Route table — shared between createHashRouter (app) and createMemoryRouter (tests)
export const routes: RouteObject[] = [
  // Standalone screens — no layout shell
  { path: ROUTES.SIGN_IN, element: withSuspense(SignInPage) },
  { path: ROUTES.FORCE_UPDATE, element: withSuspense(ForceUpdatePage) },

  // AuthGuard (stub, activates in Epic 09) wraps the persistent layout shell.
  // Nested as two layout routes so Epic 09 can add redirect logic to AuthGuard
  // without touching LayoutShell.
  {
    element: <AuthGuard />,
    children: [
      {
        element: <LayoutShell />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          { path: ROUTES.DASHBOARD, element: withSuspense(DashboardPage) },
          { path: ROUTES.ANALYSIS_NEW, element: withSuspense(AnalysisSetupPage) },
          { path: ROUTES.ANALYSIS_PROGRESS, element: withSuspense(AnalysisProgressPage) },
          { path: ROUTES.RESULTS, element: withSuspense(ResultsWorkspacePage) },
          {
            path: ROUTES.SETTINGS_ROOT,
            element: <Navigate to={`${ROUTES.SETTINGS_ROOT}/general`} replace />,
          },
          { path: ROUTES.SETTINGS, element: withSuspense(SettingsPage) },
          { path: ROUTES.PROJECTS, element: withSuspense(ProjectsPage) },
          { path: ROUTES.HELP, element: withSuspense(HelpPage) },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
];
