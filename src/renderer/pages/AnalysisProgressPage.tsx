import React from 'react';
import { useParams } from 'react-router-dom';

export function AnalysisProgressPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();

  return (
    <div data-testid="analysis-progress-page">
      <h1 className="text-xl font-semibold">Analysis in Progress</h1>
      <p className="text-neutral-400">
        ID:
        {id}
      </p>
    </div>
  );
}

export default AnalysisProgressPage;
