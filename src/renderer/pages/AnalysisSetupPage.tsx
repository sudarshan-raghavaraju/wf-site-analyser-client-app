import React from 'react';
import { useSearchParams } from 'react-router-dom';

export function AnalysisSetupPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') ?? 'url';

  return (
    <div data-testid="analysis-setup-page">
      <h1 className="text-xl font-semibold">New Analysis</h1>
      <p className="text-neutral-400">
        Source:
        {source}
      </p>
    </div>
  );
}

export default AnalysisSetupPage;
