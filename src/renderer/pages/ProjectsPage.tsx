import React from 'react';

import content from '../content/content.json';

export function ProjectsPage(): React.ReactElement {
  return (
    <div data-testid="projects-page" className="p-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Projects</h1>
      <p className="mb-8 text-sm text-gray-500">Manage and review your analysis projects.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.projects.map(({ name }) => (
          <div
            key={name}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">{name}</span>
            </div>
            <p className="text-xs text-gray-400">Last updated 2 days ago</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Completed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;
