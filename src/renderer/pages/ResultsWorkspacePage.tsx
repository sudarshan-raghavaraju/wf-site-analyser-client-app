import React from 'react';
import { useParams } from 'react-router-dom';

export function ResultsWorkspacePage(): React.ReactElement {
  const { projectId, analysisId } = useParams<{
    projectId: string;
    analysisId: string;
  }>();

  return (
    <div data-testid="results-workspace-page">
      <h1 className="text-xl font-semibold">Results Workspace</h1>
      <p className="text-neutral-400">{`Project: ${projectId} / Analysis: ${analysisId}`}</p>
    </div>
  );
}

export default ResultsWorkspacePage;
