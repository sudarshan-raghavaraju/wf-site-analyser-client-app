import React from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function NotFoundPage(): React.ReactElement {
  return (
    <div
      data-testid="not-found-page"
      className="flex h-full flex-col items-center justify-center text-gray-900"
    >
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-gray-500">Page not found</p>
      <Link to={ROUTES.DASHBOARD} className="mt-6 text-blue-600 underline hover:text-blue-700">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
